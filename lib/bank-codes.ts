// Kenyan bank codes used by PesaLink / Co-op Bank OpenAPI (BankCode field).
// Codes are the official IPSL/PesaLink beneficiary bank identifiers.
// NOTE: Verify against the latest IPSL/PesaLink published list before go-live.

export interface BankInfo {
  code: string;
  name: string;
}

export const KENYAN_BANKS: BankInfo[] = [
  { code: '01', name: 'Stanbic Bank Kenya' },
  { code: '02', name: 'Standard Chartered Bank Kenya' },
  { code: '03', name: 'Agricultural Development Bank (ADB)' },
  { code: '04', name: 'ABSA Bank Kenya' },
  { code: '05', name: 'Jamii Bora Bank' },
  { code: '06', name: 'Bank of Baroda Kenya' },
  { code: '07', name: 'NCBA Bank' },
  { code: '08', name: 'Mwananchi Microfinance Bank' },
  { code: '09', name: 'Bank of Africa Kenya' },
  { code: '10', name: 'Bank of India' },
  { code: '11', name: 'Co-operative Bank of Kenya' },
  { code: '12', name: 'Commercial Bank of Africa (NCBA)' },
  { code: '13', name: 'Consolidated Bank of Kenya' },
  { code: '14', name: 'Credit Bank' },
  { code: '15', name: 'K-Rep Bank (Sidian)' },
  { code: '16', name: 'Development Bank of Kenya' },
  { code: '17', name: 'Diamond Trust Bank Kenya' },
  { code: '18', name: 'Ecobank Kenya' },
  { code: '19', name: 'Equity Bank Kenya' },
  { code: '20', name: 'Family Bank' },
  { code: '21', name: 'First Community Bank' },
  { code: '22', name: 'Guaranty Trust Bank Kenya' },
  { code: '23', name: 'Gulf African Bank' },
  { code: '24', name: 'Victoria Bank' },
  { code: '25', name: 'Habib Bank AG Zurich' },
  { code: '26', name: 'Housing Finance (HFC)' },
  { code: '27', name: 'I&M Bank' },
  { code: '28', name: 'Imperial Bank Kenya' },
  { code: '29', name: 'KCB Bank Kenya' },
  { code: '30', name: 'Mayfair Bank' },
  { code: '31', name: 'Middle East Bank Kenya' },
  { code: '32', name: 'Murang\u2019a County Bank' },
  { code: '33', name: 'National Bank of Kenya' },
  { code: '34', name: 'NIC Bank (NCBA)' },
  { code: '35', name: 'SBM Bank Kenya' },
  { code: '36', name: 'Spire Bank' },
  { code: '37', name: 'Sidian Bank' },
  { code: '38', name: 'Stanbic Bank Kenya' },
  { code: '39', name: 'Transnational Bank' },
  { code: '40', name: 'United Bank for Africa Kenya' },
  { code: '41', name: 'Access Bank Kenya' },
  { code: '42', name: 'DIB Bank Kenya' },
  { code: '43', name: 'Maisha Bank' },
  { code: '44', name: 'Paramount Universal Bank' },
  { code: '45', name: 'Prime Bank' },
  { code: '46', name: 'Rafiki Microfinance Bank' },
  { code: '47', name: 'Faulu Microfinance Bank' },
  { code: '48', name: 'KWFT (Kenya Women Microfinance Bank)' },
];