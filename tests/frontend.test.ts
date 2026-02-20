import { test, expect } from 'playwright-test-coverage';

async function adminLogin(page: Page){

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByText('Mama Ricci\'s kitchen')).toBeVisible();
  
  await expect(page.getByRole('main')).toContainText('Franchises');
  await expect(page.getByRole('main')).toContainText('LotaPizza');
  await expect(page.getByRole('main')).toContainText('American Fork');
  await expect(page.getByRole('main')).toContainText('PizzaCorp');
  await expect(page.getByRole('main')).toContainText('Users');

}



async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = { 'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: 'diner' }] }, 'john@jwt.com': { id: '4', name: 'John Franchise', email: 'john@jwt.com', password: '1234', roles: [{ role: 'diner' },{objectId: 2, role: "franchisee"}] }, 'a@jwt.com': { id: '5', name: 'Admin Bob', email: 'a@jwt.com', password: 'a', roles: [{ role: 'admin' }] }};

  // Authorize login for the given user
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = route.request().postDataJSON();
    if (route.request().method() == 'DELETE'){
      await route.fulfill({json: {message :"logout successful"}})
      return;
    }
    if (route.request().method() == 'POST'){
      const userRes = { user: { id: 2, name: 'my man', email: 'myMan@jwt.com', roles: [{ role: 'diner' }] }, token: '12345' }
      await route.fulfill({json: userRes})
      return;
    }
    const user = validUsers[loginReq.email];
    if (!user || user.password !== loginReq.password) {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
      return;
    }
    loggedInUser = validUsers[loginReq.email];
    const loginRes = {
      user: loggedInUser,
      token: 'abcdef',
    };
    expect(route.request().method()).toBe('PUT');
    await route.fulfill({ json: loginRes });
    
  });

  // Return the currently logged in user
  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser });
  });

  // Return a mocked out list of users
  await page.route(/\/api\/user(\?.*)?$/, async (route) => {
    const userRes = { users: [
      { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: 'diner' }] },
      { id: '4', name: 'John Franchise', email: 'john@jwt.com', password: '1234', roles: [{ role: 'diner' },{objectId: 2, role: "franchisee"}] },
      { id: '5', name: 'Admin Bob', email: 'a@jwt.com', password: 'a', roles: [{ role: 'admin' }] }
    ],
    }
    const url = route.request().url();
    const parsed = new URL(url);
    let name = parsed.searchParams.get("name");
    if (name != '*' && name != null){
      name = name.replace(/\*/g, "")
      userRes.users = userRes.users.filter((u) => (u.name.includes(name)))
    }
    await route.fulfill({ json: userRes})
  })

  // A standard menu
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      {
        id: 1,
        title: 'Veggie',
        image: 'pizza1.png',
        price: 0.0038,
        description: 'A garden of delight',
      },
      {
        id: 2,
        title: 'Pepperoni',
        image: 'pizza2.png',
        price: 0.0042,
        description: 'Spicy treat',
      },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  //Viewing franchises
  await page.route(/\/api\/franchise\/\d+/, async (route) => {
   const franchiseRes = [
      {
          "id": 4,
          "name": "John's Franchise",
          "admins": [
              {
                  "id": 2,
                  "name": "John Franchise",
                  "email": "john@john.com"
              }
          ],
          "stores": [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
          ],
          "total revenue": 0,
      }
    ]
    if (route.request().method() == 'DELETE'){
      await route.fulfill({json: {message: 'franchise deleted'}})
      return;
    }
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });

  });

  // Standard franchises and stores
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const franchiseRes = {
      franchises: [
        {
          id: 2,
          name: 'LotaPizza',
          stores: [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [] },
      ],
    };
    if (route.request().method() == 'POST'){
      const createFranchiseRes = { name: 'johns franchise', admins: [{ email: 'john@john.com', id: 2, name: 'John franchisee' }], id: 4 }
      await route.fulfill({json: createFranchiseRes})
      return;
    }
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });


  // Order a pizza.
  await page.route('*/**/api/order', async (route) => {
    if (route.request().method() == 'GET'){
      route.fulfill({json: {orders: []} })
      return;
    }
    const orderReq = route.request().postDataJSON();
    const orderRes = {
      order: { ...orderReq, id: 23 },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: orderRes });
  });

  await page.goto('/');
}

test('login', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('purchase with login', async ({ page }) => {
  await basicInit(page);

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();
});

test('about and history', async ({page}) => {
  page.goto('/');
  await expect(page.getByRole('contentinfo')).toContainText('About');
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('main')).toContainText('The secret sauce');
  await page.getByRole('heading', { name: 'Our employees' }).click();
  await page.getByRole('link', { name: 'History' }).click();
  await expect(page.getByRole('heading')).toContainText('Mama Rucci, my my');
  await expect(page.getByRole('main').getByRole('img')).toBeVisible();
})

test('logout', async ({page}) => {
  await basicInit(page);

  //login guy
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  
  //test logout
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Register'})).toBeVisible();
})

test('login as franchisee', async ({page}) => {
  await basicInit(page);
  //expect default nonfranchise display to show up
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await expect(page.getByText('So you want a piece of the')).toBeVisible();

  //login as a franchisee
  await page.getByRole('link', { name: 'Login', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('john@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('1234');
  await page.getByRole('button', { name: 'Login' }).click();

  //view franchisee dashboard
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  
  await expect(page.getByRole('heading')).toContainText('John\'s Franchise');
  await expect(page.locator('tbody')).toContainText('Lehi');
  await expect(page.locator('tbody')).toContainText('Springville');

  //check create store page
  await page.getByRole('button', { name: 'Create store' }).click();
  await expect(page.getByRole('heading')).toContainText('Create store');
  await expect(page.locator('form')).toContainText('Create');
})

test('login as admin', async ({page})=> {
  await basicInit(page);
  await adminLogin(page);

})


test('view User list', async ({page}) => {
  await basicInit(page);
  await adminLogin(page);
  await page.getByRole('link', { name: 'Admin', exact: true }).click();
  await expect(page.getByRole('main')).toContainText('Users');
  await expect(page.getByRole('main')).toContainText('Kai Chen');
})

test('filter User list', async ({page}) => {
  await basicInit(page);
  await adminLogin(page);
  await page.getByRole('link', { name: 'Admin', exact: true }).click();
  await expect(page.getByRole('main')).toContainText('Users');
  await expect(page.getByRole('main')).toContainText('Kai Chen');
  
  await page.getByRole('textbox', { name: 'Filter users' }).click();
  await page.getByRole('textbox', { name: 'Filter users' }).fill('Kai');
  await page.getByRole('button', { name: 'Submit' }).nth(1).click();

  await expect(page.getByRole('main')).toContainText('Kai Chen');
  await expect(page.getByRole('main')).not.toContainText('John');
})

test('create and delete franchise', async ({page}) => {
  await basicInit(page)
  await adminLogin(page)
  //endpoints are mocked as to not actually edit the data of the franchise list, but this will suffice since we know that the franchises can be displayed

  //create a franchise
  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await page.getByRole('textbox', { name: 'franchise name' }).click();
  await page.getByRole('textbox', { name: 'franchise name' }).fill('John\'s Place');
  await page.getByRole('textbox', { name: 'franchisee admin email' }).click();
  await page.getByRole('textbox', { name: 'franchisee admin email' }).fill('john@jwt.com');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.locator('h2')).toContainText('Mama Ricci\'s kitchen');
  
  await expect(page.getByRole('main')).toContainText('topSpot');


  // //close a franchise
  await page.getByRole('row', { name: 'LotaPizza Close' }).getByRole('button').click();
  await expect(page.getByRole('heading')).toContainText('Sorry to see you go');
  await expect(page.getByRole('main')).toContainText('LotaPizza');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('h2')).toContainText('Mama Ricci\'s kitchen');
  
  await expect(page.getByRole('main')).toContainText('Franchises');
})

test('close a store', async ({page}) => {
  await basicInit(page);
  await adminLogin(page);

  await page.getByRole('row', { name: 'Lehi ₿ Close' }).getByRole('button').click();
  await expect(page.getByRole('heading')).toContainText('Sorry to see you go');
  await expect(page.getByRole('main')).toContainText('Lehi');
  await expect(page.getByRole('main')).toContainText('LotaPizza');
})

test('register new user', async ({page}) => {
  await basicInit(page);

  //register new user
  await page.getByRole('link', { name: 'Register' }).click();
  await expect(page.getByRole('heading')).toContainText('Welcome to the party');
  await page.getByRole('textbox', { name: 'Full name' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('My Guy');
  await page.getByRole('textbox', { name: 'Full name' }).press('Tab');
  await page.getByRole('textbox', { name: 'Email address' }).fill('myguy@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('1234');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByLabel('Global')).toContainText('mm');

  //view diner dashboard
  await page.getByRole('link', { name: 'mm' }).click();
  await expect(page.getByRole('main')).toContainText('How have you lived this long without having a pizza? Buy one now!');
  await expect(page.getByRole('main')).toContainText('my man');
});

//updates user name and password correctly
test('updateUser diner', async ({ page }) => {
  // await updateUserMock(page)
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  
  await page.getByRole('link', { name: 'KC' }).click();
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
});


test('docs', async ({page}) => {
  await basicInit(page);
  await page.goto('http://localhost:5173/docs');
  await expect(page.getByRole('heading')).toContainText('JWT Pizza API');
})


