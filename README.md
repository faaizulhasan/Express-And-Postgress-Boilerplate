# Backend-Boilerplate

# Module Generator

This project includes a module generator script to automate the creation and management of new modules and their respective database configurations.

## Requirements
Before you can use the module generator, ensure that:
- Node.js is installed on your system.
- Sequelize and your database are correctly set up and configured in your project.

## Usage

### 1. Generate a New Module

To generate a new module, use the following command in your terminal:

```bash
generate-module <ModuleName> <TableName>
```
##### ModuleName:
The name of the module you want to create. It should be written in PascalCase (e.g., User, Product, Order).

##### TableName:
The name of the database table that the module will interact with. Typically written in snake_case (e.g., users, products, orders).

## 2. Rollback a Module
  To rollback (delete) a module that was previously generated, use the following command:

```bash
rollback-module <ModuleName>
```
##### ModuleName:
The name of the module you want to remove (e.g., User, Product).

## 3. Generate Client Token
  To generate a new client_id, use the following command:

```bash
generate-client-token
```