/**
 * Seed: Creates default company + admin user + user types
 * 
 * Admin login:
 *   Email:    admin@rexjobs.com
 *   Password: Admin@123
 */
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {

  // 1. Company

    await knex('tblcompany').insert({
      uuid:        uuidv4(),
      companyname: 'RexJobs',
      companyemail:'admin@rexjobs.com',
      isadmincompany: 1,
      isactive:    1,
      isdeleted:   0,
      addeddate:   new Date()
    });


  // 2. User types
  const types = [
  ];
  for (const t of types) {
    const ex = await knex('tblusertype').where('usertypeid', t.usertypeid).first();
    if (!ex) await knex('tblusertype').insert({ ...t, uuid: uuidv4(), isactive:1, isdeleted:0, addeddate: new Date() });
  }

  // 3. Admin user
  const existingAdmin = await knex('tbluser').where('useremail', 'admin@rexjobs.com').first();
  if (!existingAdmin) {
    const hashed = await bcrypt.hash('Admin@123', 10);
    await knex('tbluser').insert({
      uuid:         uuidv4(),
      fname:        'Admin',
      lname:        'User',
      useremail:    'admin@rexjobs.com',
      userpassword: hashed,
      mobile:       null,
      usertypeid:   1,
      isadmin:      1,
      issuperadmin: 1,
      isactive:     1,
      islogin:      0,
      issignup:     0,
      isdeleted:    0,
      addeddate:    new Date()
    });
    console.log('\n✅ Admin user created:');
    console.log('   Email:    admin@rexjobs.com');
    console.log('   Password: Admin@123\n');
  } else {
    console.log('\nℹ️  Admin user already exists — skipping\n');
  }
};
