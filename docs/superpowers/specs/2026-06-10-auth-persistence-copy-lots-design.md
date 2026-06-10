# Auth Persistence and Copy Lots Design

## Context

DHYTrade is deployed with Docker on Linux. The frontend stores `accessToken`, `refreshToken`, and `user` in `localStorage`, and its Axios interceptor already attempts `/api/auth/refresh` when an authenticated request returns `401`. The backend currently returns only a placeholder response from `/api/auth/refresh`, so an expired access token causes the frontend to clear local storage and redirect to login.

The copy calculator currently computes lots as `floor(targetAmount / price / 100)`. When a proportional target is less than one board lot, the result is `0`, even if the user's total capital is enough to buy one lot of that stock. The result table displays suggested lots as read-only text.

## Goals

- Keep Docker-deployed users logged in across ordinary visits until the configured refresh token expiry is reached.
- Implement refresh token rotation through the existing `/api/auth/refresh` endpoint.
- Preserve the existing localStorage-based frontend session model.
- In copy calculation, suggest one lot when the proportional result is below one lot and the user's total capital can buy one lot of that stock.
- Allow users to manually edit calculated lots in the copy calculator and recalculate actual amounts immediately in the frontend.

## Non-Goals

- Do not add server-side session cookies.
- Do not add multi-device token management UI.
- Do not persist manually edited copy lots.
- Do not change the stock board lot size from the existing 100-share assumption.
- Do not redesign the calculator page beyond the required editable lots control.

## Authentication Design

### Backend

Add refresh token state to the user record:

- `RefreshToken`: nullable string.
- `RefreshTokenExpiresAt`: nullable UTC timestamp.

On login:

- Validate username and password as today.
- Generate an access token as today.
- Generate a refresh token.
- Store the refresh token and expiry on the user.
- Save the user record.
- Return both tokens and the user DTO.

On refresh:

- Accept the existing `RefreshRequest`.
- Find an active user whose stored refresh token matches the request value and whose expiry is still in the future.
- If no user matches, return `401`.
- Generate a new access token and a new refresh token.
- Replace the stored refresh token and expiry.
- Return an `AuthResponse` containing both new tokens and the user DTO.

Refresh token expiry comes from `Jwt:RefreshTokenExpiryDays`, already present in `appsettings.json` and `docker-compose.yml`. Existing access token expiry remains configured by `Jwt:AccessTokenExpiryMinutes`.

### Frontend

Keep the existing localStorage session model. The Axios response interceptor should continue refreshing on `401`, but it should be guarded so a retried request is only refreshed once. If refresh succeeds, save both returned tokens and retry the original request. If refresh fails, clear localStorage and redirect to `/login`.

## Copy Calculator Design

### Backend Calculation

For each active position:

1. Compute `ratio = position.TotalCost / baseCapital`.
2. Compute `targetAmount = ownCapital * ratio`.
3. Compute `rawLots = floor(targetAmount / price / 100)`.
4. If `rawLots` is `0` and `ownCapital >= price * 100`, use `1`.
5. Otherwise use `rawLots`.
6. Compute `actualAmount = suggestedLots * 100 * price`.

This means a low-ratio position can still suggest one lot when the user's overall capital can afford that one lot. It does not require the proportional target amount for that individual stock to cover one lot.

### Frontend Editing

Replace the read-only suggested lots display with an `InputNumber` in the table:

- Minimum value: `0`.
- Step: `1`.
- Precision: `0`.
- On change, update only that row's `suggestLots`.
- Recompute that row's `actualAmount = suggestLots * 100 * price`.
- Recompute the displayed total actual amount from all rows.

The API response shape can remain unchanged because it already includes `suggestLots`, `price`, and `actualAmount`.

## Error Handling

- Invalid refresh tokens return `401` with a short Chinese error message.
- Expired refresh tokens return `401`.
- Disabled users cannot refresh.
- If refresh fails on the frontend, the user is sent to the login page as today.
- If quote data is missing, copy calculation continues to fall back to the position's current price as today.

## Testing

Backend tests should cover:

- Login stores a refresh token and expiry.
- Refresh with a valid token returns a new access token and rotated refresh token.
- Refresh with an expired or unknown token returns unauthorized.
- Copy calculation returns one lot when the proportional result is zero and `ownCapital` can buy one lot.
- Copy calculation returns zero lots when `ownCapital` cannot buy one lot.

Frontend verification should cover:

- Build succeeds after table lot editing changes.
- Edited lots update row actual amount and total actual amount.

## Migration and Deployment

Add an EF Core migration for the new nullable user token columns. Existing users will need to log in once after deployment to receive a refresh token. After that, normal revisits should refresh automatically until the configured refresh expiry.
