# Administrator Login Credentials

## Default System Administrator Account

**Email:** it.system@albpetrol.al  
**Password:** Admin2025!

## Account Details
- Role: Administrator (Protected)
- Default Admin: Yes (Cannot be deleted)
- Created: 2025-08-08
- Status: Active

## Other Admin Accounts

**Thanas Dinaku**
- Email: thanas.dinaku@albpetrol.al
- Role: Admin
- Status: Active

**TrueAlbos**
- Email: truealbos@gmail.com  
- Role: Admin
- Status: Active

## User Accounts

1. **Enisa Cepele** - enisa.cepele@albpetrol.al (User)
2. **Jorgjica Baba** - jorgjica.baba@albpetrol.al (User)  
3. **Isabel Loci** - Isabel.Loci@cix.csi.cuny.edu (User)
4. **Isabel Loci Gmail** - isabelloci64@gmail.com (User)

## Password Reset Instructions

If you need to reset any password:

```bash
# Connect to database
psql $DATABASE_URL

# Reset password (use bcrypt hash)
UPDATE users SET password = '$2b$10$...' WHERE email = 'user@example.com';
```

## Access URL
https://legal.albpetrol.al

---
*Last updated: August 19, 2025*