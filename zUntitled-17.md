npx tsx scripts/backfill-contractors.ts
In create and edit contractors the category is not being saved
- Add (http://localhost:3010/contractor/wallets/approvals) to sidebar and add its permsions including approve
- The permision called approve should not appear on all modules, its an independent permision, update that,
It is used to approve transactions
http://localhost:3010/contractor/inventory/categories and http://localhost:3010/contractor/suppliersshould be scoped by contractor

http://localhost:3010/contractor/settings Roles and permisions tab should be guarded by permisions including create and update and delete

license expiry alert configure
subscription can only allow one site if another site user has to add subscription
tsx scripts/migrate-approve-permission.ts

tsx scripts/test-bank-api.ts -i --
npm install
npx prisma migrate dev --name init
npx prisma db seed
PORT=4030 pm2 start npm --name "dev-reconsmi" -- run start

v1/ext/ipn
2E25DINdYYEV5c0vPp0kaAzl

Note: The IPN route at app/v1/ext/ipn/route.ts currently just logs and forwards the payload to a webhook — it doesn't call handleBankFundsTransferCallback. If the bank calls back to this new URL, transferred funds won't be processed. Want me to wire the IPN route to call handleBankFundsTransferCallback?