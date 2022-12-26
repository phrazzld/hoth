# hoth

Hoth is an API service that makes it easy to leverage common Firebase authentication and licensing patterns in your own applications, without managing that boilerplate yourself.

Below is documentation of each exposed Hoth endpoint. The base URL for every request is `https://us-central1-hoth-authentication.cloudfunctions.net/`

## `createUserFunction`

### Introduction

`createUserFunction` is a Cloud Function that exposes the `createUser` function as an HTTP endpoint. This endpoint allows clients to create new users in the Firebase auth service.

### Endpoint

`POST /createUserFunction`

### Request

#### Headers

| Header       | Required | Description                                                             |
|--------------|----------|-------------------------------------------------------------------------|
| `Content-Type` | Yes    | Must be set to `application/json`.                                      |

#### Body

The request body should be a JSON object with the following properties:

| Property    | Required | Type     | Description                                                             |
|-------------|----------|----------|-------------------------------------------------------------------------|
| `apiKey`    | Yes      | `string` | The API key. Must be a valid API key in order to create the user.       |
| `email`     | Yes      | `string` | The email address of the user. Must be a unique email address.          |
| `password`  | Yes      | `string` | The password for the user. Must meet the password requirements specified by Firebase. |

#### Example

```
{
  "apiKey": "1234567890",
  "email": "user@example.com",
  "password": "password123"
}
```

### Response

#### Status codes

- `201 Created`: The user was created successfully.
- `401 Unauthorized`: The API key is invalid or the request is missing the `apiKey` property.
- `500 Internal Server Error`: An unexpected error occurred while creating the user.

#### Body

If the request is successful (status code `201`), the response body will be a JSON object with the following property:

| Property    | Type     | Description                                                             |
|-------------|----------|-------------------------------------------------------------------------|
| `userId`    | `string` | The unique identifier of the user.                                      |

#### Example

```
{
  "userId": "abcdefghijklmnopqrstuvwxyz"
}
```

If the request is unsuccessful (status codes `401` or `500`), the response body will be a JSON object with the following property:

| Property    | Type     | Description                                                             |
|-------------|----------|-------------------------------------------------------------------------|
| `error`     | `string` | A description of the error that occurred.                                |

#### Example

```
{
  "error": "The API key is invalid."
}
```
