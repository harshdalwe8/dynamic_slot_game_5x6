# Database Setup and Migration Documentation

This directory contains the necessary files for setting up and managing the PostgreSQL database for the Dynamic Multi-Theme 5×6 Slot Game System.

## Migrations

- **migrations/001_create_slot_tables.sql**: This SQL file contains the migration script to create the required tables for the slot game system. It defines the structure for users, wallets, transactions, themes, spins, and admin logs. Run this script to initialize the database schema.

## Seeders

- **seeders/seed_themes.sql**: This SQL file contains the script to seed the database with initial theme data. It populates the themes table with predefined themes that can be used in the slot game. Execute this script after running the migration to ensure that the application has the necessary data to function correctly.

## Setup Instructions

1. **Database Configuration**: Ensure that your PostgreSQL database is set up and accessible. Update the database connection settings in the backend configuration file as needed.

2. **Run Migrations**: Execute the migration script to create the necessary tables in your PostgreSQL database. You can use a database client or command line to run the SQL script.

3. **Seed Database**: After the migration is complete, run the seeder script to populate the themes table with initial data.

4. **Verify Setup**: Check the database to ensure that the tables and initial data have been created successfully.

This setup is crucial for the backend functionality of the slot game system, enabling data persistence and management for game operations.