#!/bin/bash

# Fix Migration Files - Add explicit short index names
# Run this script to fix all migrations

cd "$(dirname "$0")/database/migrations"

echo "Fixing migration files..."

# Migration 001 - ErrorLog indexes
sed -i "s/table.index('CreatedDate');/table.index('CreatedDate', 'idx_errlog_date');/g" 20260206000001_create_core_tables.js
sed -i "s/table.index('companyid');/table.index('companyid', 'idx_errlog_company');/g" 20260206000001_create_core_tables.js

# Migration 001 - Menu indexes  
sed -i "s/table.index(\['ParentId', 'Sequence'\]);/table.index(['ParentId', 'Sequence'], 'idx_menu_parent');/g" 20260206000001_create_core_tables.js
sed -i "s/table.index(\['companyid', 'IsDeleted', 'IsShowInMenu'\]);/table.index(['companyid', 'IsDeleted', 'IsShowInMenu'], 'idx_menu_company');/g" 20260206000001_create_core_tables.js

# Migration 001 - UserType indexes
sed -i "s/table.index(\['companyid', 'isactive', 'isdeleted'\]);/table.index(['companyid', 'isactive', 'isdeleted'], 'idx_usertype_company');/g" 20260206000001_create_core_tables.js

# Migration 001 - Rights indexes
sed -i "s/table.index(\['UserTypeId', 'MenuId', 'IsDeleted'\]);/table.index(['UserTypeId', 'MenuId', 'IsDeleted'], 'idx_rights_usertype');/g" 20260206000001_create_core_tables.js

# Migration 002 - Countries
sed -i "s/table.index('sortname');/table.index('sortname', 'idx_country_code');/g" 20260206000002_create_master_data_tables.js
sed -i "s/table.index('name');/table.index('name', 'idx_country_name');/g" 20260206000002_create_master_data_tables.js

# Migration 002 - States
sed -i "s/table.index('country_id');/table.index('country_id', 'idx_state_country');/g" 20260206000002_create_master_data_tables.js

# Migration 002 - Cities
sed -i "s/table.index('state_id');/table.index('state_id', 'idx_city_state');/g" 20260206000002_create_master_data_tables.js

# Migration 002 - Users
sed -i "s/table.index('usertypeid');/table.index('usertypeid', 'idx_user_type');/g" 20260206000002_create_master_data_tables.js

# Migration 002 - ForgotPassword
sed -i "s/table.index('token');/table.index('token', 'idx_forgot_token');/g" 20260206000002_create_master_data_tables.js

# Migration 003 - Client
sed -i "s/table.index('clientemail');/table.index('clientemail', 'idx_client_email');/g" 20260206000003_create_client_job_tables.js
sed -i "s/table.index('clienttypeid');/table.index('clienttypeid', 'idx_client_type');/g" 20260206000003_create_client_job_tables.js

# Migration 003 - ClientDocument
sed -i "s/table.index('companyid');/table.index('companyid', 'idx_clientdoc_company');/g" 20260206000003_create_client_job_tables.js

# Migration 003 - RequirementType
sed -i "s/table.index('requirementtypename');/table.index('requirementtypename', 'idx_reqtype_name');/g" 20260206000003_create_client_job_tables.js

# Migration 004 - tblrequirement
sed -i "s/table.index('requirementpriorityid');/table.index('requirementpriorityid', 'idx_req_priority');/g" 20260206000004_create_requirements_table.js

# Migration 005 - tblapplyjob
sed -i "s/table.index('applyjobemail');/table.index('applyjobemail', 'idx_apply_email');/g" 20260206000005_create_applications_candidates_tables.js

# Migration 005 - tblcandidate
sed -i "s/table.index('candidateemail');/table.index('candidateemail', 'idx_cand_email');/g" 20260206000005_create_applications_candidates_tables.js

# Migration 006 - Category
sed -i "s/table.index('SeoName');/table.index('SeoName', 'idx_category_seo');/g" 20260206000006_create_supporting_tables.js

# Migration 006 - Blogs
sed -i "s/table.index('AuthorId');/table.index('AuthorId', 'idx_blog_author');/g" 20260206000006_create_supporting_tables.js

# Migration 006 - BlogComment
sed -i "s/table.index('AddedDate');/table.index('AddedDate', 'idx_comment_date');/g" 20260206000006_create_supporting_tables.js

# Migration 006 - Vendor
sed -i "s/table.index('vendoremail');/table.index('vendoremail', 'idx_vendor_email');/g" 20260206000006_create_supporting_tables.js

# Migration 006 - SubmitQuery
sed -i "s/table.index('email');/table.index('email', 'idx_query_email');/g" 20260206000006_create_supporting_tables.js

# Migration 006 - VisitorCount
sed -i "s/table.index('addeddate');/table.index('addeddate', 'idx_visitor_date');/g" 20260206000006_create_supporting_tables.js

echo "✅ All migration files fixed!"
echo "Now run: npm run migrate:latest"
