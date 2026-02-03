import { test, expect } from 'playwright-test-coverage';

test('test', async ({ page }) => {

  // need to add a random name to make our random email guy
  //then go to the user account page and make sure the correct email is displayed
  await page.goto('http://localhost:5173/');
  await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('bob');
  await page.getByRole('textbox', { name: 'Email address' }).fill('bob@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('monkeypie');
  await page.getByRole('button', { name: 'Register' }).click();
});

//