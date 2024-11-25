This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

## Active Link : https://pathaka-ai.netlify.app/

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Deployment**: Vercel (recommended)

# Supabase Database Actions

This module provides a set of utility functions for interacting with a Supabase database. It includes operations for authentication, user management, and CRUD (Create, Read, Update, Delete) operations on database tables.

## Functions

### Authentication

1. `signInWithSupabase(form: { email: string; password: string })`

   - Signs in a user with their email and password.

2. `signUpWithSupabase(form: { email: string; password: string; username: string })`

   - Registers a new user with their email, password, and username.

3. `getAuthenticatedUser()`
   - Retrieves the currently authenticated user.

### Database Operations

4. `addDataToSupabase(tableName: string, data: any)`

   - Inserts new data into a specified table.

5. `deleteDataFromSupabase(tableName: string, condition: { column: string; value: any })`

   - Deletes data from a specified table based on a condition.

6. `updateDataInSupabase(tableName: string, id: number, data: any)`
   - Updates data in a specified table for a given ID.

## Usage

First, import the required functions:

````
# Stripe Checkout API

This project implements a Stripe Checkout API endpoint using Next.js API routes.

## Usage

To use the checkout API, send a POST request to `/api/checkout` with the following structure:

### Example React Component

Here's an example of how to use the checkout API in a React component:

```jsx
import React, { useState } from 'react';

const CheckoutButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              name: 'Product Name',
              price: 1999, // Price in cents
              quantity: 1,
            },
            // Add more items as needed
          ],
        }),
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    } catch (error) {
      console.error('Error:', error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleCheckout} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Checkout'}
    </button>
  );
};

export default CheckoutButton;
````

This component creates a button that, when clicked, sends a request to the checkout API and redirects the user to the Stripe Checkout page.

### Request Body

The `items` array should contain objects with the following properties:

- `name`: The name of the product
- `price`: The price of the product in cents (e.g., $19.99 should be 1999)
- `quantity`: The quantity of the product

### Response

The API will return a JSON object with a `sessionId`. Use this `sessionId` to redirect the user to the Stripe Checkout page.

## Environment Variables

Make sure to set the following environment variable:

- `STRIPE_SECRET_KEY`: Your Stripe secret key

## Notes

- This example uses a test Stripe key. Replace it with your actual secret key in production.
- Ensure proper error handling and validation in a production environment.
- The success and cancel URLs are currently set to `/success` and `/cancel` respectively. Update these as needed for your application.
