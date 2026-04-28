const fs = require('fs');
const sql = fs.readFileSync('D:/currency_web/create_tables.sql', 'utf16le');

const skipTables = ['audit_logs', 'bank_account_rejection_logs', 'branches', 'card_charge_logs', 'card_operation_logs', 'card_transactions', 'cards', 'exchange_activity_log', 'exchange_company', 'exchange_company_user', 'export_audit_events', 'export_batch_items', 'export_batches', 'export_delivery_log', 'export_posting_lines', 'export_postings', 'flyway_schema_history', 'fx_companies', 'fx_contracts', 'fx_credit_records', 'fx_debit_records', 'fx_purchase_request', 'fx_requests', 'otp_challenges', 'password_reset_requests', 'password_reset_tokens', 'roles', 'salary_rejection_logs', 'system_logs', 'topup_transactions', 'transfer_logs', 'user_roles', 'users'];

const statements = sql.split('-- ');
const outSql = [];

for (let stmt of statements) {
    if (!stmt.trim() || stmt.trim() === 'Update available 6.19.3 -> 7.8.0') continue;
    stmt = '-- ' + stmt.trim();
    
    let skip = false;
    for (let table of skipTables) {
        if (stmt.includes('"' + table + '"')) {
            skip = true;
            break;
        }
    }
    
    // Also skip the update banner
    if (stmt.includes('Update available')) {
        skip = true;
    }
    
    if (!skip) {
        outSql.push(stmt);
    }
}

fs.writeFileSync('D:/BankTest/Al-waha/springboot-backend/src/main/resources/db/migration/V15__create_nextjs_tables.sql', outSql.join('\n\n'), 'utf8');
console.log('V15 script generated!');
