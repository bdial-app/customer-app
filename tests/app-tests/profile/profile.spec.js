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
});

