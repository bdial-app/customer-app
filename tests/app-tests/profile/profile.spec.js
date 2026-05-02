import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'Profile' }).click();
  await page.getByText('Edit ProfileName, gender,').click();
  await page.getByRole('textbox', { name: 'Your name' }).click();
  await page.getByRole('textbox', { name: 'Your name' }).press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: 'Your name' }).fill('Sultankhan Pathan');
  await page.getByRole('textbox', { name: 'City name' }).click();
  await page.getByRole('textbox', { name: 'City name' }).press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: 'City name' }).fill('Mumbai');
  await page.getByRole('textbox', { name: 'Locality area' }).click();
  await page.getByRole('textbox', { name: 'Locality area' }).press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: 'Locality area' }).fill('Andheri West');
  await page.getByRole('textbox', { name: 'Area pincode' }).click();
  await page.getByRole('textbox', { name: 'Area pincode' }).press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: 'Area pincode' }).fill('411001');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await page.getByRole('button', { name: 'Profile' }).click();
  await page.getByText('Saved AddressesHome, office,').click();
  await page.getByRole('textbox', { name: 'Search for area, street,' }).click();
  await page.getByRole('textbox', { name: 'Search for area, street,' }).fill('Lunkad Zodiac');
  await page.getByRole('button', { name: 'LUNKAD ZODIAC Satyam Marg,' }).click();
  await page.getByRole('button', { name: 'Office' }).click();
  await page.getByRole('button', { name: 'Other' }).click();
  await page.getByRole('button', { name: 'Home' }).click();
  await page.getByRole('button', { name: 'Save Address' }).click();

  await page.getByRole('button', { name: 'Profile' }).click();
  await page.locator('.relative.w-11').click();
  await page.locator('.relative.w-11').click();
  await page.getByText('Language🇬🇧 English').click();
  await page.getByRole('button', { name: '🇮🇳 हिन्दी Hindi' }).click();
  await page.getByRole('button', { name: '🇮🇳 मराठी Marathi' }).click();
  await page.getByRole('button', { name: '🇮🇳 ગુજરાતી Gujarati' }).click();
  await page.getByRole('button', { name: '🇮🇳 বাংলা Bengali' }).click();
  await page.getByRole('button', { name: '🇮🇳 தமிழ் Tamil' }).click();
  await page.getByRole('button', { name: '🇮🇳 తెలుగు Telugu' }).click();
  await page.getByRole('button', { name: '🇵🇰 اردو Urdu' }).click();
  await page.getByRole('button', { name: '🇸🇦 العربية Arabic' }).click();
  await page.getByRole('button', { name: '🇫🇷 Français French' }).click();
  await page.getByRole('button', { name: '🇬🇧 English English' }).click();
  await page.getByRole('button', { name: 'Back' }).click();

  await page.getByRole('button', { name: 'Profile' }).click();
  await page.locator('div').filter({ hasText: 'Help & FAQ' }).nth(5).click();
  await page.getByRole('button', { name: 'What is Tijarah (BohriConnect' }).click();
  await page.getByRole('button', { name: 'What does \'Tijarah\' mean? ▾' }).click();
  await page.getByRole('button', { name: 'Is Tijarah only for Dawoodi' }).click();
  await page.getByRole('button', { name: 'Which cities is Tijarah' }).click();
  await page.getByRole('button', { name: 'Is Tijarah free to use? ▾' }).click();
  await page.getByRole('button', { name: 'How do I find a business? ▾' }).click();
  await page.getByRole('button', { name: 'How do I contact a business? ▾' }).click();
  await page.getByRole('button', { name: 'Does Tijarah handle orders or' }).click();
  await page.getByRole('button', { name: 'What does the \'Verified\'' }).click();
  await page.getByRole('button', { name: 'Can I post a review? ▾' }).click();
  await page.getByRole('button', { name: 'How do I report a business or' }).click();
  await page.getByRole('button', { name: 'How do I list my business on' }).click();
  await page.getByRole('button', { name: 'How do I get the \'Verified\'' }).click();
  await page.getByRole('button', { name: 'My business was already' }).click();
  await page.locator('div').filter({ hasText: /^Can I update or remove my listing\?▾$/ }).click();
  await page.getByRole('button', { name: 'What personal data does' }).click();
  await page.getByRole('button', { name: 'Can I delete my account and' }).click();
  await page.getByRole('button', { name: 'Does Tijarah sell my data? ▾' }).click();
  await page.getByRole('button', { name: 'How do I turn off notifications? ▾' }).click();
  await page.getByRole('button', { name: 'How do I turn off location' }).click();
  await page.getByRole('button', { name: 'I found a bug. What do I do? ▾' }).click();
  await page.getByRole('button', { name: 'Back' }).click();

  await page.locator('div').filter({ hasText: 'Report a Bug' }).nth(5).click();
  await page.getByRole('button', { name: 'App Crash' }).click();
  await page.getByRole('button', { name: 'UI / Display Issue' }).click();
  await page.getByRole('button', { name: 'Feature Not Working' }).click();
  await page.getByRole('button', { name: 'Slow / Performance' }).click();
  await page.getByRole('button', { name: 'Login / Auth Issue' }).click();
  await page.getByRole('button', { name: 'Payment Issue' }).click();
  await page.getByRole('button', { name: 'Other' }).click();
  await page.getByRole('button', { name: 'Feature Not Working' }).click();
  await page.getByRole('textbox', { name: 'What went wrong? What did you' }).click();
  await page.getByRole('textbox', { name: 'What went wrong? What did you' }).fill('Favourite providers List does not save in profile and is not visible on clicking');
  await page.getByRole('textbox', { name: '1. Open the app 2. Tap on...' }).click();
  await page.getByRole('textbox', { name: '1. Open the app 2. Tap on...' }).fill('Open the App. Navigate to profile. Click Favourite provider.');
  await page.getByRole('button', { name: 'Submit Bug Report' }).click();
  await page.getByRole('button', { name: 'Done' }).click();

  
});

