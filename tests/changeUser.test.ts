import { test, expect } from 'playwright-test-coverage';

async function updateUserMock(page: Page) {
  await page.route(/\/api\/user\/\d+/, async (route) => {
    expect(route.request().method()).toBe('PUT');
    let user = route.request().postDataJSON();
    await route.fulfill({ json: user });
  });
}
//So this correctly mocks out the update User endpoint, the problem is that I would also have to mock out a DB
//a get user endpoint, and then somehow simulate that updating of a user
//seems a bit too difficult to be worth it.


//updates user name and password correctly
test('updateUser diner', async ({ page }) => {
  // await updateUserMock(page)
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza diner');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('pizza dinerx');
  await page.locator('#password').fill('pancake');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('pizza dinerx');

  await page.getByRole('link', { name: 'Logout' }).click();

  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('pancake');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza dinerx');

});

//Login as an admin and change my information, then change it back to not corrupt my data
test('updateUser admin', async({page}) => {
   await page.goto('/');

   await page.getByRole('link', { name: 'Login' }).click();
   await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
   await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
   await page.getByRole('textbox', { name: 'Password' }).fill('admin');
   await page.getByRole('button', { name: 'Login' }).click();

   await page.getByRole('link', { name: '常' }).click();
   await expect(page.getByRole('button')).toContainText('Edit');
   await page.getByRole('button', { name: 'Edit' }).click();
   await expect(page.locator('#hs-jwt-modal').getByText('name:')).toBeVisible();
   await page.locator('input[type="email"]').fill('ad@jwt.com');
   await page.getByRole('button', { name: 'Update' }).click();
   await expect(page.getByText('ad@jwt.com')).toBeVisible();
   await page.getByRole('link', { name: 'Logout' }).click();

   await page.getByRole('link', { name: 'Login' }).click();
   await page.getByRole('textbox', { name: 'Email address' }).fill('ad@jwt.com');
   await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
   await page.getByRole('textbox', { name: 'Password' }).fill('admin');
   await page.getByRole('button', { name: 'Login' }).click();
   await page.getByRole('link', { name: '常' }).click();
   await expect(page.getByText('ad@jwt.com')).toBeVisible();

   await page.getByRole('button', { name: 'Edit' }).click();
   await page.locator('input[type="email"]').fill('a@jwt.com');
   await page.getByRole('button', { name: 'Update' }).click();
   await expect(page.getByRole('main')).toContainText('a@jwt.com');
});
