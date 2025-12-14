import { NextResponse } from 'next/server';
import sql from 'mssql';

const config = {
  user: 'ssipl',
  password: 'ssipl@123',
  server: '192.168.20.5',
  port: 1433,
  database: 'CRM', // Use CRM for SMS_OUTt
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool = null;

async function getDb() {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}

export async function POST(request) {
  const { recipient_number, sms_text } = await request.json();
  console.log('Received:', { recipient_number, sms_text });

  try {
    const db = await getDb();
    await db.request()
      .input('sms_text', sql.NVarChar, sms_text)
      .input('recipient_number', sql.NVarChar, recipient_number)
      .query(`
        INSERT INTO [CRM].[dbo].[SMS_OUT] 
          (SMS_TEXT, RECIPIENT_NUMBER)
        VALUES 
          (@sms_text, @recipient_number)
      `);
    console.log('Inserted SMS_OUT:', { recipient_number, sms_text });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('SQL Insert Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}