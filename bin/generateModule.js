#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const _ = require("lodash");

// Initialize Sequelize
const dbConfig = require("../app/config/db.js");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.DIALECT,
    logging: false,
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
});

// --- Get Table Schema (MySQL / PostgreSQL) ---
const getTableSchema = async (tableName) => {
    try {
        const dialect = dbConfig.DIALECT.toLowerCase();
        let columns, foreignKeys;

        if (dialect === 'mysql') {
            [columns] = await sequelize.query(`SHOW COLUMNS FROM ${tableName}`);
            [foreignKeys] = await sequelize.query(`
        SELECT
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME,
            UPDATE_RULE,
            DELETE_RULE
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS USING(CONSTRAINT_NAME)
        WHERE TABLE_NAME = '${tableName}'
        AND TABLE_SCHEMA = '${dbConfig.DB}'
        AND REFERENCED_TABLE_NAME IS NOT NULL;
      `);

            const fkMap = Object.fromEntries(foreignKeys.map(fk => [fk.COLUMN_NAME, fk]));

            return columns.map(col => {
                const ref = fkMap[col.Field];
                if (ref) {
                    col.ReferencedTable = ref.REFERENCED_TABLE_NAME;
                    col.ReferencedColumn = ref.REFERENCED_COLUMN_NAME;
                    col.onUpdate = ref.UPDATE_RULE;
                    col.onDelete = ref.DELETE_RULE;
                }
                return col;
            });
        }

        // --- PostgreSQL version ---
        if (dialect === 'postgres') {
            [columns] = await sequelize.query(`
        SELECT 
          column_name AS "Field",
          data_type AS "Type",
          is_nullable AS "Null",
          column_default AS "Default"
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position;
      `);

            [foreignKeys] = await sequelize.query(`
        SELECT
          kcu.column_name AS "COLUMN_NAME",
          ccu.table_name AS "REFERENCED_TABLE_NAME",
          ccu.column_name AS "REFERENCED_COLUMN_NAME",
          rc.update_rule AS "UPDATE_RULE",
          rc.delete_rule AS "DELETE_RULE"
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
        WHERE constraint_type = 'FOREIGN KEY'
          AND tc.table_name='${tableName}';
      `);

            const fkMap = Object.fromEntries(foreignKeys.map(fk => [fk.COLUMN_NAME, fk]));

            return columns.map(col => {
                const ref = fkMap[col.Field];
                if (ref) {
                    col.ReferencedTable = ref.REFERENCED_TABLE_NAME;
                    col.ReferencedColumn = ref.REFERENCED_COLUMN_NAME;
                    col.onUpdate = ref.UPDATE_RULE;
                    col.onDelete = ref.DELETE_RULE;
                }
                return col;
            });
        }

        throw new Error(`Unsupported dialect: ${dialect}`);

    } catch (err) {
        console.error('Error fetching table schema:', err);
        process.exit(1);
    }
};

// --- Generate Module Files ---
const generateModule = async (moduleName, tableName) => {
    const columns = await getTableSchema(tableName);
    if (!columns) return;
    await generateDatabaseFile(moduleName, tableName, columns);
    await generateModelFile(moduleName, tableName, columns);
    await generateControllerFile(moduleName, columns);
    await generateResourceFile(moduleName, columns);
    await generateRoutes(moduleName);
    console.info("✅ Module generated successfully");
    process.exit(0);
};

// --- Generate Sequelize Database Model ---
const generateDatabaseFile = async (moduleName, tableName, columns) => {
    const fields = columns.map(col => {
        const primaryKey = col.Key === 'PRI' ? 'primaryKey: true,' : '';
        const autoIncrement = col.Extra?.includes('auto_increment') || col.Default?.includes('nextval')
            ? 'autoIncrement: true,' : '';
        const unique = col.Key === 'UNI' ? 'unique: true,' : '';
        const defaultValue = col.Default
            ? col.Default.includes('CURRENT_TIMESTAMP')
                ? 'defaultValue: Sequelize.NOW,'
                : `defaultValue: "${col.Default}",`
            : '';
        const reference = col.ReferencedTable ? `
      references: {
        model: '${col.ReferencedTable}',
        key: '${col.ReferencedColumn || 'id'}'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    ` : '';

        return `
      ${col.Field}: {
        type: Sequelize.${mapDataType(col.Type)},
        ${[primaryKey, autoIncrement, unique, defaultValue, reference].filter(Boolean).join('\n        ')}
        allowNull: ${col.Null === 'YES'}
      }`;
    }).join(',\n    ');

    const modelTemplate = `
module.exports = (sequelize, Sequelize) => {
  const ${moduleName} = sequelize.define("${tableName}", {
    ${fields}
  }, {
    timestamps: true,
    paranoid: true,
  });

  return ${moduleName};
};
  `;

    const modelPath = path.join(process.cwd(), 'app', 'Database', `${moduleName}.js`);
    fs.writeFileSync(modelPath, modelTemplate, 'utf8');
    const mainFilePath = path.join(process.cwd(), "app", "Database", 'index.js');
    fs.appendFileSync(mainFilePath, `\ndb.${tableName} = require("./${moduleName}.js")(sequelize, Sequelize);\n`);
    console.info(`✅ ${moduleName}.js Database File created`);
};

// --- Data type mapping for MySQL + PostgreSQL ---
const mapDataType = (sqlType = '') => {
    sqlType = sqlType.toLowerCase();

    if (sqlType.includes('int')) return 'INTEGER';
    if (sqlType.includes('bigint')) return 'BIGINT';
    if (sqlType.includes('smallint')) return 'SMALLINT';
    if (sqlType.includes('varchar')) return `STRING(${sqlType.match(/\d+/)?.[0] || 255})`;
    if (sqlType.includes('character varying')) return `STRING(${sqlType.match(/\d+/)?.[0] || 255})`;
    if (sqlType.includes('text')) return 'TEXT';
    if (sqlType.includes('timestamp') || sqlType.includes('datetime')) return 'DATE';
    if (sqlType.includes('boolean')) return 'BOOLEAN';
    if (sqlType.includes('json')) return 'JSON';
    if (sqlType.includes('decimal') || sqlType.includes('numeric')) return 'DECIMAL';
    if (sqlType.includes('float') || sqlType.includes('double')) return 'FLOAT';
    if (sqlType.includes('date')) return 'DATE';
    return 'STRING';
};

// --- Generate Other Files (same as before, unchanged) ---
const generateModelFile = async (moduleName, tableName, columns) => {
    const notUpdateColumns = ['id', 'createdAt'];
    const fields = columns.map((column) => column.Field);
    const modelTemplate = `
const _ = require("lodash");
const RestModel = require("./RestModel"); 

class ${moduleName} extends RestModel {
  constructor() {
    super("${tableName}");
  }
  softdelete() { return true; }
  includeShow() { return []; }
  includeIndex() { return []; }

  getFields() {
    return [${(fields.filter(f => !notUpdateColumns.includes(f))).map(f => `"${f}"`).join(', ')}];
  }
  showColumns() { return [${fields.map(f => `"${f}"`).join(', ')}]; }
  exceptUpdateField() { return [${fields.map(f => `"${f}"`).join(', ')}]; }
}
module.exports = ${moduleName};
  `;
    const modelPath = path.join(process.cwd(), 'app', 'Models', `${moduleName}.js`);
    fs.writeFileSync(modelPath, modelTemplate, 'utf8');
};

// --- Controller / Resource / Routes unchanged (same as your code) ---

// Handle CLI args
const args = process.argv.slice(2);
if (args.length !== 2) {
    console.error('Usage: generate-module <ModuleName> <TableName>');
    process.exit(1);
}

generateModule(args[0], args[1]);
