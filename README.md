# Policy Pulse UI

Policy Pulse UI is a React + TypeScript frontend for the Policy Pulse application.

It connects to the Spring Boot Policy Pulse API and allows users to manage insurance policies, upload policy documents, download policy documents, search by status, and navigate paginated policy records.

## Features

- View paginated policy records
- Create a new policy
- Edit existing policy details
- Delete a policy
- Search policies by status
- Upload policy documents
- Download policy documents
- Display loading and error states
- Connect to Spring Boot REST API
- Uses TypeScript types for safer frontend development

## Tech Stack

- React
- TypeScript
- Vite
- CSS
- Fetch API
- Spring Boot backend integration

## Project Structure

src

- App.tsx
- main.tsx
- PoliciesPage.tsx
- components
- assets
- styles

## Main Concepts

### Policy Type

The UI works with policy objects returned by the backend.

Main fields:

- id
- policyNumber
- holderName
- status
- premium
- documentKey

Example policy:

{
  "id": 1,
  "policyNumber": "POL101",
  "holderName": "John Doe",
  "status": "ACTIVE",
  "premium": 500.00,
  "documentKey": "1714450000000_policy.pdf"
}

### Backend API

The UI calls the Spring Boot backend running on:

http://localhost:8080

Main API endpoints used by the UI:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/policies?page=0&size=10 | Load paginated policies |
| POST | /api/policies | Create policy |
| PUT | /api/policies/{id} | Update policy |
| DELETE | /api/policies/{id} | Delete policy |
| GET | /api/policies/search?status=ACTIVE&page=0&size=10 | Search policies by status |
| POST | /api/policies/{id}/document | Upload policy document |
| GET | /api/policies/{id}/document | Download policy document |

## Application Flow

### Load Policies

User opens the UI -> React calls GET /api/policies -> Backend returns paginated policies -> UI displays policy table/cards

### Create Policy

User enters policy details -> UI sends POST /api/policies -> Backend saves policy -> UI refreshes policy list

### Update Policy

User edits policy -> UI sends PUT /api/policies/{id} -> Backend updates policy -> UI refreshes policy list

### Delete Policy

User clicks delete -> UI sends DELETE /api/policies/{id} -> Backend deletes policy -> UI refreshes policy list

### Upload Document

User selects file -> UI sends multipart/form-data request to POST /api/policies/{id}/document -> Backend uploads file to S3 -> Backend stores S3 document key in database -> UI refreshes policy list

### Download Document

User clicks download -> UI calls GET /api/policies/{id}/document -> Backend returns file bytes -> Browser downloads the file

## Run Locally

Install dependencies:

npm install

Start the development server:

npm run dev

The UI runs on:

http://localhost:5173

## Backend Requirement

Before using the UI, make sure the Policy Pulse API backend is running on:

http://localhost:8080

The backend should allow CORS for:

http://localhost:5173

## Important UI States

The UI handles:

- loading state while API calls are running
- error messages when API calls fail
- upload state for the selected policy
- download state for the selected policy
- pagination state using page and size
- search/filter state using policy status

## Example User Actions

### Create Policy

User enters:

policyNumber = POL101  
holderName = John Doe  
status = ACTIVE  
premium = 500.00  

Then the UI sends this data to the backend.

### Upload Document

User selects a PDF or document file.

The UI sends the selected file as multipart/form-data.

The backend stores the file in AWS S3 and saves only the document key in the database.

### Download Document

User clicks download.

The UI receives file bytes from the backend and triggers browser download.

## Notes

- The UI does not store policy documents.
- The actual document is stored in AWS S3 by the backend.
- The UI only sends files to the backend and receives files back during download.
- The backend stores only the S3 document key in the database.
- The UI uses fetch API to communicate with the backend.

## Future Improvements

- Add authentication and authorization
- Add better form validation
- Add confirmation modal before delete
- Add toast notifications
- Add sorting support
- Add status dropdown filter
- Add unit tests with React Testing Library
- Add end-to-end tests
- Improve responsive design
- Add environment variable for backend API base URL
