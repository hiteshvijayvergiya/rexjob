/**
 * Migration: 001_create_core_tables.js
 * Creates: ActivityLog, ErrorLog, Menu, Rights, Company, UserType
 */

exports.up = function (knex) {
    return knex.schema
    // 1. Company Table (Master - Create First)
        .createTable('tblcompany', (table) => {
            table.increments('companyid').primary();
            table.uuid('uuid').notNullable().unique();
            table.string('companyname', 100);
            table.string('companyaddress', 500);
            table.string('companymobile', 50);
            table.string('companyemail', 50);
            table.string('companywebsite', 100);
            table.string('companygst', 50);
            table.string('companypan', 50);
            table.string('companylogo', 500);
            table.string('countrycode', 500);
            table.integer('companycity');
            table.integer('companystate');
            table.integer('companycountry');
            table.string('companygstno', 500);
            table.string('companyregistrationno', 500);
            table.date('companystartdate', 100);
            table.string('companyfevicon', 500);
            table.text('userpermission'); // JSON / long permissions
            table.boolean('isadmincompany').defaultTo(false);
            table.date('contractstartdate');
            table.date('contractenddate');


            table.datetime('addeddate');
            table.integer('addedby');
            table.datetime('updateddate');
            table.integer('updatedby');
            table.datetime('deleteddate');
            table.integer('deletedby');
            table.boolean('isactive').defaultTo(true);
            table.boolean('isdeleted').defaultTo(false);

            // Indexes
            table.index(['isactive', 'isdeleted'], 'idx_company_active');
            table.index('companyemail', 'idx_company_email');
        })

        // 2. Activity Log
        .createTable('ActivityLog', (table) => {
            table.bigIncrements('ActivityId').primary();
            table.text('ActivityLog');
            table.integer('MenuId');
            table.bigInteger('UserId');
            table.bigInteger('RecordId');
            table.bigInteger('CreatedBy');
            table.datetime('CreatedDate');
            table.integer('companyid');

            // Indexes
            table.index(['UserId', 'CreatedDate'], 'idx_actlog_user');
            table.index(['MenuId', 'CreatedDate'], 'idx_actlog_menu');
            table.index('companyid', 'idx_actlog_company');
        })

        // 3. Error Log
        .createTable('ErrorLog', (table) => {
            table.bigIncrements('ErrorId').primary();
            table.uuid('uuid').notNullable().unique();
            table.text('ErrorMsg');
            table.text('InnerException');
            table.string('IpAddress', 50);
            table.bigInteger('UserId');
            table.datetime('CreatedDate');
            table.string('Controller', 255);
            table.string('Action', 255);
            table.bigInteger('LineNumber');
            table.integer('companyid');

            // Indexes
            table.index(['UserId', 'CreatedDate']);
            table.index(['Controller', 'Action']);
            table.index('CreatedDate', 'idx_errlog_date');
            table.index('companyid', 'idx_errlog_company');
        })

        // 4. Menu
        .createTable('Menu', (table) => {
            table.integer('MenuId').primary();
            table.uuid('uuid').notNullable().unique();
            table.string('MenuName', 255);
            table.string('Action', 255);
            table.string('Controller', 255);
            table.integer('ParentId');
            table.integer('Sequence');
            table.string('Icon', 500);
            table.boolean('IsShowInMenu').defaultTo(true);
            table.datetime('CreatedDate');
            table.datetime('UpdatedDate');
            table.datetime('DeletedDate');
            table.boolean('IsDeleted').defaultTo(false);
            table.integer('companyid');

            // Indexes
            table.index(['ParentId', 'Sequence'], 'idx_menu_parent');
            table.index(['companyid', 'IsDeleted', 'IsShowInMenu'], 'idx_menu_company');
        })



        // 6. Rights
        .createTable('Rights', (table) => {
            table.bigIncrements('RightId').primary();
            table.uuid('uuid').notNullable().unique();
            table.integer('MenuId');
            table.boolean('Add').defaultTo(false);
            table.boolean('Edit').defaultTo(false);
            table.boolean('Delete').defaultTo(false);
            table.boolean('View').defaultTo(false);
            table.boolean('Print').defaultTo(false);
            table.boolean('IsShowAll').defaultTo(false);
            table.integer('UserTypeId');
            table.datetime('CreatedDate');
            table.datetime('UpdatedDate');
            table.datetime('DeletedDate');
            table.bigInteger('CreatedBy');
            table.bigInteger('UpdatedBy');
            table.bigInteger('DeletedBy');
            table.boolean('IsDeleted').defaultTo(false);
            table.integer('companyid');

            // Indexes
            table.index(['UserTypeId', 'MenuId', 'IsDeleted'], 'idx_rights_usertype');
            table.index('companyid', 'idx_errlog_company');
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('Rights')
        .dropTableIfExists('tblusertype')
        .dropTableIfExists('Menu')
        .dropTableIfExists('ErrorLog')
        .dropTableIfExists('ActivityLog')
        .dropTableIfExists('tblcompany');
};
