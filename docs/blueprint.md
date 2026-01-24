# **App Name**: CampusCafe

## Core Features:

- Login Screen: Simple login screen with name input and role selection (Customer/Vendor/Admin).
- Cafe Selection: Vendor role: choose cafe from dropdown (Firestore cafes where approved=true, isDisabled=false).
- Session Management: Save session in LocalStorage: {name, role, cafeId(optional)}.
- Logout Functionality: Logout button to clear LocalStorage.
- Role-Based Routing: Customer routes prefix: /c/*, Vendor routes prefix: /v/*, Admin routes prefix: /a/*.
- Firestore Cafe Data: Retrieve approved and enabled cafe data from Firestore.

## Style Guidelines:

- Primary color: Deep maroon (#800000) for warmth and richness reminiscent of coffee.
- Background color: Light beige (#F5F5DC), offering a clean and inviting feel.
- Accent color: Golden yellow (#FFD700) to highlight interactive elements and important information, analogous to the primary maroon.
- Headline font: 'Playfair', a modern sans-serif with high contrast lines.
- Body font: 'PT Sans', a humanist sans-serif used for longer text.
- Simple and clean icons related to cafe services and roles, in a consistent style.
- Clean and modern layout with clear sections for login, cafe selection, and role-based navigation.