# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile\profile.spec.js >> test
- Location: tests\app-tests\profile\profile.spec.js:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Done' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]: Tijarah
  - generic [ref=e13]:
    - heading "My Profile" [level=1] [ref=e16]
    - generic [ref=e18]:
      - generic [ref=e20]: SP
      - generic [ref=e21]:
        - heading "Sultankhan Pathan" [level=2] [ref=e22]
        - paragraph [ref=e23]: "9881070876"
        - paragraph [ref=e24]: Andheri West, Mumbai
      - button [ref=e25]:
        - img [ref=e26]:
          - img [ref=e28]
    - generic [ref=e33]:
      - heading "Become a Provider" [level=3] [ref=e34]
      - paragraph [ref=e35]: Start offering your services on Tijarah
      - button "Apply Now →" [ref=e36]
    - generic [ref=e39]:
      - generic [ref=e40]: Account
      - generic [ref=e41]:
        - generic [ref=e42] [cursor=pointer]:
          - img [ref=e44]:
            - img [ref=e46]
          - generic [ref=e49]:
            - text: Edit Profile
            - paragraph [ref=e50]: Name, gender, location
          - img [ref=e51]:
            - img [ref=e53]
        - generic [ref=e55] [cursor=pointer]:
          - img [ref=e57]:
            - img [ref=e59]
          - generic [ref=e62]:
            - text: Saved Addresses
            - paragraph [ref=e63]: Home, office, and more
          - img [ref=e64]:
            - img [ref=e66]
        - generic [ref=e68] [cursor=pointer]:
          - img [ref=e70]:
            - img [ref=e72]
          - generic [ref=e74]:
            - text: Saved Providers
            - paragraph [ref=e75]: Your favourites
          - img [ref=e76]:
            - img [ref=e78]
    - generic [ref=e80]:
      - generic [ref=e81]: Preferences
      - generic [ref=e82]:
        - generic [ref=e83] [cursor=pointer]:
          - img [ref=e85]:
            - img [ref=e87]
          - generic [ref=e89]:
            - text: Notifications
            - paragraph [ref=e90]: Push & in-app alerts
          - img [ref=e91]:
            - img [ref=e93]
        - generic [ref=e95] [cursor=pointer]:
          - img [ref=e97]:
            - img [ref=e99]
          - generic [ref=e101]:
            - text: Dark Mode
            - paragraph [ref=e102]: "Off"
        - generic [ref=e105] [cursor=pointer]:
          - img [ref=e107]:
            - img [ref=e109]
          - generic [ref=e114]:
            - text: Language
            - paragraph [ref=e115]: 🇬🇧 English
          - img [ref=e116]:
            - img [ref=e118]
    - generic [ref=e120]:
      - generic [ref=e121]: Support
      - generic [ref=e122]:
        - generic [ref=e123] [cursor=pointer]:
          - img [ref=e125]:
            - img [ref=e127]
          - generic [ref=e131]: Help & FAQ
          - img [ref=e132]:
            - img [ref=e134]
        - generic [ref=e136] [cursor=pointer]:
          - img [ref=e138]:
            - img [ref=e140]
          - generic [ref=e143]:
            - text: Contact Us
            - paragraph [ref=e144]: support@tijarah.app
          - img [ref=e145]:
            - img [ref=e147]
        - generic [ref=e149] [cursor=pointer]:
          - img [ref=e151]:
            - img [ref=e153]
          - generic [ref=e157]: Report a Bug
          - img [ref=e158]:
            - img [ref=e160]
    - generic [ref=e162]:
      - generic [ref=e163]: Legal
      - generic [ref=e164]:
        - generic [ref=e165] [cursor=pointer]:
          - img [ref=e167]:
            - img [ref=e169]
          - generic [ref=e173]: About Us
          - img [ref=e174]:
            - img [ref=e176]
        - generic [ref=e178] [cursor=pointer]:
          - img [ref=e180]:
            - img [ref=e182]
          - generic [ref=e185]: Terms & Conditions
          - img [ref=e186]:
            - img [ref=e188]
        - generic [ref=e190] [cursor=pointer]:
          - img [ref=e192]:
            - img [ref=e194]
          - generic [ref=e197]: Privacy Policy
          - img [ref=e198]:
            - img [ref=e200]
    - generic [ref=e202]:
      - generic [ref=e203]: Data & Privacy
      - generic [ref=e204]:
        - generic [ref=e205] [cursor=pointer]:
          - img [ref=e207]:
            - img [ref=e209]
          - generic [ref=e212]:
            - text: Download My Data
            - paragraph [ref=e213]: Export all your data as JSON
          - img [ref=e214]:
            - img [ref=e216]
        - generic [ref=e218] [cursor=pointer]:
          - img [ref=e220]:
            - img [ref=e222]
          - generic [ref=e225]:
            - text: Manage Saved Data
            - paragraph [ref=e226]: Locations, favourites, history
          - img [ref=e227]:
            - img [ref=e229]
    - generic [ref=e232]:
      - generic [ref=e233] [cursor=pointer]:
        - img [ref=e235]:
          - img [ref=e237]
        - generic [ref=e239]: Log Out
        - img [ref=e240]:
          - img [ref=e242]
      - generic [ref=e244] [cursor=pointer]:
        - img [ref=e246]:
          - img [ref=e248]
        - generic [ref=e251]:
          - text: Pause Account
          - paragraph [ref=e252]: Temporarily freeze your account
        - img [ref=e253]:
          - img [ref=e255]
      - generic [ref=e257] [cursor=pointer]:
        - img [ref=e259]:
          - img [ref=e261]
        - generic [ref=e264]:
          - text: Delete Account
          - paragraph [ref=e265]: Permanently remove your data
        - img [ref=e266]:
          - img [ref=e268]
    - generic [ref=e270]:
      - paragraph [ref=e271]: Tijarah v1.0.0
      - paragraph [ref=e272]: Made with ♥ in India
    - generic [ref=e273]:
      - generic [ref=e275]:
        - button "Back" [ref=e276]:
          - img [ref=e277]:
            - img [ref=e279]
          - text: Back
        - heading "Report a Bug" [level=2] [ref=e281]
      - generic [ref=e283]:
        - paragraph [ref=e284]: Found something broken? Tell us what happened and we'll fix it as quickly as possible.
        - generic [ref=e285]:
          - generic [ref=e286]: Bug Category
          - generic [ref=e287]:
            - button "App Crash" [ref=e288]
            - button "UI / Display Issue" [ref=e289]
            - button "Feature Not Working" [ref=e290]
            - button "Slow / Performance" [ref=e291]
            - button "Login / Auth Issue" [ref=e292]
            - button "Payment Issue" [ref=e293]
            - button "Other" [ref=e294]
        - generic [ref=e295]:
          - generic [ref=e296]: Describe the Bug *
          - textbox "What went wrong? What did you expect to happen?" [ref=e297]: Favourite providers List does not save in profile and is not visible on clicking
          - paragraph [ref=e298]: 80/1000
        - generic [ref=e299]:
          - generic [ref=e300]: Steps to Reproduce (optional)
          - textbox "1. Open the app 2. Tap on... 3. Bug appears" [ref=e301]: Open the App. Navigate to profile. Click Favourite provider.
        - paragraph [ref=e302]: Your device info will be included automatically to help us debug.
        - button "Submitting..." [disabled] [ref=e303]
    - generic [ref=e307]:
      - button "Home" [ref=e308]:
        - img [ref=e310]:
          - img [ref=e312]
        - generic [ref=e315]: Home
      - button "Explore" [ref=e316]:
        - img [ref=e318]:
          - img [ref=e320]
        - generic [ref=e323]: Explore
      - button "Saved" [ref=e324]:
        - img [ref=e326]:
          - img [ref=e328]
        - generic [ref=e330]: Saved
      - button "Chats" [ref=e331]:
        - img [ref=e333]:
          - img [ref=e335]
        - generic [ref=e338]: Chats
      - button "Profile" [ref=e339]:
        - img [ref=e342]:
          - img [ref=e344]
        - generic [ref=e346]: Profile
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('test', async ({ page }) => {
  4  |   await page.goto('http://localhost:3000/');
  5  |   await page.getByRole('button', { name: 'Profile' }).click();
  6  |   await page.getByText('Edit ProfileName, gender,').click();
  7  |   await page.getByRole('textbox', { name: 'Your name' }).click();
  8  |   await page.getByRole('textbox', { name: 'Your name' }).press('ControlOrMeta+a');
  9  |   await page.getByRole('textbox', { name: 'Your name' }).fill('Sultankhan Pathan');
  10 |   await page.getByRole('textbox', { name: 'City name' }).click();
  11 |   await page.getByRole('textbox', { name: 'City name' }).press('ControlOrMeta+a');
  12 |   await page.getByRole('textbox', { name: 'City name' }).fill('Mumbai');
  13 |   await page.getByRole('textbox', { name: 'Locality area' }).click();
  14 |   await page.getByRole('textbox', { name: 'Locality area' }).press('ControlOrMeta+a');
  15 |   await page.getByRole('textbox', { name: 'Locality area' }).fill('Andheri West');
  16 |   await page.getByRole('textbox', { name: 'Area pincode' }).click();
  17 |   await page.getByRole('textbox', { name: 'Area pincode' }).press('ControlOrMeta+a');
  18 |   await page.getByRole('textbox', { name: 'Area pincode' }).fill('411001');
  19 |   await page.getByRole('button', { name: 'Save Changes' }).click();
  20 | 
  21 |   await page.getByRole('button', { name: 'Profile' }).click();
  22 |   await page.getByText('Saved AddressesHome, office,').click();
  23 |   await page.getByRole('textbox', { name: 'Search for area, street,' }).click();
  24 |   await page.getByRole('textbox', { name: 'Search for area, street,' }).fill('Lunkad Zodiac');
  25 |   await page.getByRole('button', { name: 'LUNKAD ZODIAC Satyam Marg,' }).click();
  26 |   await page.getByRole('button', { name: 'Office' }).click();
  27 |   await page.getByRole('button', { name: 'Other' }).click();
  28 |   await page.getByRole('button', { name: 'Home' }).click();
  29 |   await page.getByRole('button', { name: 'Save Address' }).click();
  30 | 
  31 |   await page.getByRole('button', { name: 'Profile' }).click();
  32 |   await page.locator('.relative.w-11').click();
  33 |   await page.locator('.relative.w-11').click();
  34 |   await page.getByText('Language🇬🇧 English').click();
  35 |   await page.getByRole('button', { name: '🇮🇳 हिन्दी Hindi' }).click();
  36 |   await page.getByRole('button', { name: '🇮🇳 मराठी Marathi' }).click();
  37 |   await page.getByRole('button', { name: '🇮🇳 ગુજરાતી Gujarati' }).click();
  38 |   await page.getByRole('button', { name: '🇮🇳 বাংলা Bengali' }).click();
  39 |   await page.getByRole('button', { name: '🇮🇳 தமிழ் Tamil' }).click();
  40 |   await page.getByRole('button', { name: '🇮🇳 తెలుగు Telugu' }).click();
  41 |   await page.getByRole('button', { name: '🇵🇰 اردو Urdu' }).click();
  42 |   await page.getByRole('button', { name: '🇸🇦 العربية Arabic' }).click();
  43 |   await page.getByRole('button', { name: '🇫🇷 Français French' }).click();
  44 |   await page.getByRole('button', { name: '🇬🇧 English English' }).click();
  45 |   await page.getByRole('button', { name: 'Back' }).click();
  46 | 
  47 |   await page.getByRole('button', { name: 'Profile' }).click();
  48 |   await page.locator('div').filter({ hasText: 'Help & FAQ' }).nth(5).click();
  49 |   await page.getByRole('button', { name: 'What is Tijarah (BohriConnect' }).click();
  50 |   await page.getByRole('button', { name: 'What does \'Tijarah\' mean? ▾' }).click();
  51 |   await page.getByRole('button', { name: 'Is Tijarah only for Dawoodi' }).click();
  52 |   await page.getByRole('button', { name: 'Which cities is Tijarah' }).click();
  53 |   await page.getByRole('button', { name: 'Is Tijarah free to use? ▾' }).click();
  54 |   await page.getByRole('button', { name: 'How do I find a business? ▾' }).click();
  55 |   await page.getByRole('button', { name: 'How do I contact a business? ▾' }).click();
  56 |   await page.getByRole('button', { name: 'Does Tijarah handle orders or' }).click();
  57 |   await page.getByRole('button', { name: 'What does the \'Verified\'' }).click();
  58 |   await page.getByRole('button', { name: 'Can I post a review? ▾' }).click();
  59 |   await page.getByRole('button', { name: 'How do I report a business or' }).click();
  60 |   await page.getByRole('button', { name: 'How do I list my business on' }).click();
  61 |   await page.getByRole('button', { name: 'How do I get the \'Verified\'' }).click();
  62 |   await page.getByRole('button', { name: 'My business was already' }).click();
  63 |   await page.locator('div').filter({ hasText: /^Can I update or remove my listing\?▾$/ }).click();
  64 |   await page.getByRole('button', { name: 'What personal data does' }).click();
  65 |   await page.getByRole('button', { name: 'Can I delete my account and' }).click();
  66 |   await page.getByRole('button', { name: 'Does Tijarah sell my data? ▾' }).click();
  67 |   await page.getByRole('button', { name: 'How do I turn off notifications? ▾' }).click();
  68 |   await page.getByRole('button', { name: 'How do I turn off location' }).click();
  69 |   await page.getByRole('button', { name: 'I found a bug. What do I do? ▾' }).click();
  70 |   await page.getByRole('button', { name: 'Back' }).click();
  71 | 
  72 |   await page.locator('div').filter({ hasText: 'Report a Bug' }).nth(5).click();
  73 |   await page.getByRole('button', { name: 'App Crash' }).click();
  74 |   await page.getByRole('button', { name: 'UI / Display Issue' }).click();
  75 |   await page.getByRole('button', { name: 'Feature Not Working' }).click();
  76 |   await page.getByRole('button', { name: 'Slow / Performance' }).click();
  77 |   await page.getByRole('button', { name: 'Login / Auth Issue' }).click();
  78 |   await page.getByRole('button', { name: 'Payment Issue' }).click();
  79 |   await page.getByRole('button', { name: 'Other' }).click();
  80 |   await page.getByRole('button', { name: 'Feature Not Working' }).click();
  81 |   await page.getByRole('textbox', { name: 'What went wrong? What did you' }).click();
  82 |   await page.getByRole('textbox', { name: 'What went wrong? What did you' }).fill('Favourite providers List does not save in profile and is not visible on clicking');
  83 |   await page.getByRole('textbox', { name: '1. Open the app 2. Tap on...' }).click();
  84 |   await page.getByRole('textbox', { name: '1. Open the app 2. Tap on...' }).fill('Open the App. Navigate to profile. Click Favourite provider.');
  85 |   await page.getByRole('button', { name: 'Submit Bug Report' }).click();
> 86 |   await page.getByRole('button', { name: 'Done' }).click();
     |                                                    ^ Error: locator.click: Test timeout of 30000ms exceeded.
  87 | 
  88 |   await pause();
  89 | });
  90 | 
  91 | 
```