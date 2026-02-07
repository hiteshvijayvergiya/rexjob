-- Run this if you get index name too long errors

-- Drop and recreate indexes with short names
ALTER TABLE tblrequirementposition DROP INDEX IF EXISTS `tblrequirementposition_requirementtypeid_isactive_isdeleted_index`;
ALTER TABLE tblrequirementposition ADD INDEX idx_reqpos_type (requirementtypeid, isactive, isdeleted);

ALTER TABLE tblrequirement DROP INDEX IF EXISTS `idx_job_search`;
ALTER TABLE tblrequirement ADD INDEX idx_job_srch (isactive, isdeleted, companyid, requirementtypeid, requirementpositionid, requirementcity);

-- Add this file as reference for manual fixes if needed
