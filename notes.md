# Learning notes

## JWT Pizza code study and debugging

As part of `Deliverable ⓵ Development deployment: JWT Pizza`, start up the application and debug through the code until you understand how it works. During the learning process fill out the following required pieces of information in order to demonstrate that you have successfully completed the deliverable.

| User activity                                       | Frontend component | Backend endpoints | Database SQL |
| --------------------------------------------------- | ------------------ | ----------------- | ------------ |
| View home page                                      |  `home.tsx`          |       none        |    none      |
| Register new user<br/>(t@jwt.com, pw: test)         |  `register.tsx`      |   `POST api/auth`   |  ` INSERT INTO user (name, email, password) VALUES (?, ?, ?), [user.name, user.email, hashedPassword])`  <br/>  `INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?), [userId, role.role, 0])`        |
| Login new user<br/>(t@jwt.com, pw: test)            |   `login.tsx` <br/>  `httpPizzaService.ts`                |    `[PUT] api/auth`               |   `SELECT * FROM user WHERE email=?, [email]` <br/>  `SELECT * FROM userRole WHERE userId=?, [user.id] `       |
| Order pizza                                         |       `menu.tsx`  <br/> `payment.jsx` <br/> `delivery.jsx`           |     `[GET] api/order/menu` <br/> `[GET] api/user/me` <br/> `[POST] api/order` <br/> `[POST] api/order` <br/> (backend to pizza factory)    |    `SELECT * FROM menu`  <br/>   `INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now()), [user.id, order.franchiseId, order.storeId]` <br/> `INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?), [orderId, menuId, item.description, item.price]`     |
| Verify pizza                                        |    `delivery.tsx`                |   `[POST] api/order/verify` (Pizza factory)               |    none        |
| View profile page                                   |                    |    `[GET] api/order`               |              |
| View franchise<br/>(as diner)                       |                    |                   |              |
| Logout                                              |                    |                   |              |
| View About page                                     |                    |                   |              |
| View History page                                   |                    |                   |              |
| Login as franchisee<br/>(f@jwt.com, pw: franchisee) |                    |                   |              |
| View franchise<br/>(as franchisee)                  |                    |                   |              |
| Create a store                                      |                    |                   |              |
| Close a store                                       |                    |                   |              |
| Login as admin<br/>(a@jwt.com, pw: admin)           |                    |                   |              |
| View Admin page                                     |                    |                   |              |
| Create a franchise for t@jwt.com                    |                    |                   |              |
| Close the franchise for t@jwt.com                   |                    |                   |              |
