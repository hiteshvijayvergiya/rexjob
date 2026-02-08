/**
 * Migration: 006_create_supporting_tables.js
 * Creates: Blog, Newsletter, Vendor, SubmitQuery, VisitorCount, ImageData
 */

exports.up = function(knex) {
  return knex.schema
    // 1. Category (Blog Categories)
    .createTable('tblCategory', (table) => {
      table.bigIncrements('Id').primary();
      table.uuid('UUID').notNullable().unique();
      table.string('CategoryName', 100);
      table.string('SeoName', 50).comment('URL-friendly name');
      table.datetime('AddedDate');
      table.integer('AddedBy');
      table.datetime('UpdatedDate');
      table.integer('UpdatedBy');
      table.datetime('DeletedDate');
      table.integer('DeletedBy');
      table.boolean('IsActive').defaultTo(true);
      table.bigInteger('CompanyId');
      
      // Indexes
      table.index(['CompanyId', 'IsActive']);
      table.index('SeoName', 'idx_category_seo');
    })
    
    // 2. Blogs
    .createTable('tblBlogs', (table) => {
      table.bigIncrements('Id').primary();
      table.uuid('UUID').notNullable().unique();
      table.string('Title', 200);
      table.text('Content');
      table.bigInteger('CategoryId').unsigned();
      table.bigInteger('AuthorId');
      table.string('FeaturedImage', 500);
      table.string('Tags', 500);
      table.string('MetaTitle', 200);
      table.string('MetaDescription', 500);
      table.string('MetaKeywords', 500);
      table.string('Slug', 200).comment('URL-friendly');
      table.datetime('PublishedDate');
      table.datetime('AddedDate');
      table.integer('AddedBy');
      table.datetime('UpdatedDate');
      table.integer('UpdatedBy');
      table.datetime('DeletedDate');
      table.integer('DeletedBy');
      table.boolean('IsPublished').defaultTo(false);
      table.boolean('IsActive').defaultTo(true);
      table.bigInteger('CompanyId');
      
      // Unique constraint
      table.unique('Slug');
      
      // Indexes
      table.index(['CategoryId', 'IsPublished', 'IsActive']);
      table.index('AuthorId', 'idx_blog_author');
      table.index(['PublishedDate', 'IsPublished']);
      table.index(['CompanyId', 'IsActive']);
      
      // Foreign Key
      table.foreign('CategoryId').references('Id').inTable('tblCategory').onDelete('SET NULL');
    })
    
    // 3. Blog Comments
    .createTable('tblBlogComment', (table) => {
      table.bigIncrements('Id').primary();
      table.uuid('UUID').notNullable().unique();
      table.bigInteger('BlogId').unsigned();
      table.string('Name', 100);
      table.string('Email', 100);
      table.text('Comment');
      table.datetime('AddedDate');
      table.boolean('IsApproved').defaultTo(false);
      table.boolean('IsActive').defaultTo(true);
      
      // Indexes
      table.index(['BlogId', 'IsApproved', 'IsActive']);
      table.index('AddedDate', 'idx_comment_date');
      
      // Foreign Key
      table.foreign('BlogId').references('Id').inTable('tblBlogs').onDelete('CASCADE');
    })
    
    // 4. Vendor
    .createTable('tblvendor', (table) => {
      table.bigIncrements('vendorid').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('vendorname', 100);
      table.string('vendoremail', 50);
      table.string('vendormobile', 50);
      table.string('vendorcompanyname', 100);
      table.string('vendorservices', 500);
      table.string('vendorwebsite', 100);
      table.string('vendoraddress', 500);
      table.integer('companyid').unsigned();
      table.datetime('addeddate');
      table.integer('addedby');
      table.datetime('updateddate');
      table.integer('updatedby');
      table.datetime('deleteddate');
      table.integer('deletedby');
      table.boolean('isdeleted').defaultTo(false);
      table.integer('countrycode');
      
      // Indexes
      table.index(['companyid', 'addeddate', 'isdeleted']);
      table.index('vendoremail', 'idx_vendor_email');
      
      // Foreign Key
      table.foreign('companyid').references('companyid').inTable('tblcompany').onDelete('CASCADE');
    })
    
    // 5. Submit Query (Contact Form)
    .createTable('tblsubmitquery', (table) => {
      table.bigIncrements('submitqueryid').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('name', 100);
      table.string('email', 50);
      table.string('mobile', 50);
      table.string('subject', 200);
      table.text('description');
      table.datetime('addeddate');
      table.integer('companyid').unsigned();
      table.boolean('isdeleted').defaultTo(false);
      
      // Indexes
      table.index(['companyid', 'addeddate', 'isdeleted']);
      table.index('email', 'idx_query_email');
      
      // Foreign Key
      table.foreign('companyid').references('companyid').inTable('tblcompany').onDelete('CASCADE');
    })
    
    // 6. Newsletter
    .createTable('tlbnewsletter', (table) => {
      table.increments('newsletterid').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('newsletteremail', 50);
      table.boolean('issubscribe').defaultTo(true);
      table.datetime('addeddate');
      table.integer('company_id').unsigned();
      
      // Unique constraint
      table.unique(['newsletteremail', 'company_id']);
      
      // Indexes
      table.index(['issubscribe', 'company_id']);
      
      // Foreign Key
      table.foreign('company_id').references('companyid').inTable('tblcompany').onDelete('CASCADE');
    })
    
    // 7. Visitor Count (Analytics)
    .createTable('visitorcount', (table) => {
      table.bigIncrements('id').primary();
      table.string('ip', 100).comment('IP or source identifier');
      table.string('hostname', 100).comment('Hostname or campaign');
      table.string('ip2', 100);
      table.string('ip3', 100);
      table.integer('count').defaultTo(1);
      table.datetime('addeddate');
      
      // Indexes
      table.index(['ip', 'addeddate']);
      table.index(['hostname', 'addeddate']);
      table.index('addeddate', 'idx_visitor_date');
    })
    
    // 8. Image Data
    .createTable('tblimagedata', (table) => {
      table.bigIncrements('id').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('imagename', 200);
      table.string('imagepath', 500);
      table.string('imagetype', 50);
      table.bigInteger('recordid').comment('Related record ID');
      table.string('recordtype', 50).comment('Table name');
      table.datetime('addeddate');
      table.integer('addedby');
      table.integer('companyid').unsigned();
      table.boolean('isdeleted').defaultTo(false);
      
      // Indexes
      table.index(['recordtype', 'recordid']);
      table.index(['companyid', 'isdeleted']);
      
      // Foreign Key
      table.foreign('companyid').references('companyid').inTable('tblcompany').onDelete('CASCADE');
    })
    
    // 9. Job Table (Alternative/Legacy)
    .createTable('tblJob', (table) => {
      table.bigIncrements('Id').primary();
      table.uuid('UUID').notNullable().unique();
      table.string('JobTitle', 200);
      table.text('JobDescription');
      table.string('CompanyName', 200);
      table.string('Location', 200);
      table.string('SalaryRange', 100);
      table.datetime('PostedDate');
      table.datetime('ExpiryDate');
      table.boolean('IsActive').defaultTo(true);
      table.integer('CompanyId').unsigned();
        table.string('JobIcon', 500);
        table.string('JobSeoUrl', 300);
        table.uuid('ParentUUID');
        table.datetime('AddedDate');
        table.integer('AddedBy');
        table.datetime('UpdatedDate');
        table.integer('UpdatedBy');
        table.datetime('DeletedDate');
        table.integer('DeletedBy');
        table.string('SeoJobKeyword', 500);
        table.string('SeoJobDescription', 500);
        table.string('OgDescriptionSeo', 500);
        table.string('SeoOgTitle', 300);
      // Indexes
      table.index(['CompanyId', 'IsActive', 'PostedDate']);
      table.index(['ExpiryDate', 'IsActive']);
    })
    
    // 10. Proposal Mail Sent
    .createTable('tblproposalmailsent', (table) => {
      table.increments('id').primary();
      table.string('emailto', 200);
      table.string('subject', 500);
      table.text('body');
      table.datetime('sentdate');
      
      // Indexes
      table.index(['emailto', 'sentdate']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('tblproposalmailsent')
    .dropTableIfExists('tblJob')
    .dropTableIfExists('tblimagedata')
    .dropTableIfExists('visitorcount')
    .dropTableIfExists('tlbnewsletter')
    .dropTableIfExists('tblsubmitquery')
    .dropTableIfExists('tblvendor')
    .dropTableIfExists('tblBlogComment')
    .dropTableIfExists('tblBlogs')
    .dropTableIfExists('tblCategory');
};
