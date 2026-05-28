# Cognito Confirmation Email Template

## Purpose

This document records the Traffiq account-confirmation email branding prepared
for the v4 release.

The goal is to make the email that contains the Cognito confirmation code look
like part of the Traffiq product, not like a default AWS system message.

## Current Decision

Chosen approach:

- use a custom HTML confirmation email template
- keep the Cognito confirmation code placeholder: `{####}`
- use the new Traffiq traffic-light city icon as the email logo
- keep the wording short and user-facing

Template file:

```text
docs/cognito_email/traffiq_confirmation_email.html
```

Mobile branding asset used by the template:

```text
mobile/assets/traffiq-icon.png
```

## Applied AWS State

The branded confirmation email was applied in AWS.

Current Cognito email configuration:

| Setting | Value |
| --- | --- |
| Email sending account | `DEVELOPER` |
| Sender service | Amazon SES |
| Sender identity | `alexandrubocanci123@gmail.com` |
| From address | `Traffiq <alexandrubocanci123@gmail.com>` |
| Reply-to address | `alexandrubocanci123@gmail.com` |
| Verification mode | confirmation code |
| Email subject | `Codul tau Traffiq` |

Public logo URL used by the template:

```text
https://traffiq-public-assets-896080425393-eu-central-1.s3.eu-central-1.amazonaws.com/public/traffiq-icon.png
```

Public asset storage:

| Setting | Value |
| --- | --- |
| Service | Amazon S3 |
| Bucket | `traffiq-public-assets-896080425393-eu-central-1` |
| Object key | `public/traffiq-icon.png` |
| Public access scope | read-only for `public/*` |

Validation result:

```text
SES sender identity -> verified
SES test alias -> verified
Cognito SignUp test -> DeliveryMedium=EMAIL
Cognito ForgotPassword test -> DeliveryMedium=EMAIL
Cognito SignUp test -> Destination present
AutoVerifiedAttributes -> email
Temporary Cognito user -> deleted after validation
```

Follow-up validation on 2026-05-28:

- fixed the footer copy typo where the question mark was rendered as the
  Romanian `Ț` character
- reapplied the corrected verification template to Cognito
- restored `AutoVerifiedAttributes=["email"]` on the User Pool so SignUp sends
  the account confirmation code automatically
- validated SignUp delivery again through the verified SES test alias

The same Cognito code email template is intentionally written generically as
`Codul tau Traffiq`, so it works for both:

- account confirmation
- password reset

## Important AWS Constraint

Cognito can send verification emails with either:

- the default Cognito email sender
- an Amazon SES sender configuration

For a fully custom HTML body through the user pool verification template,
Cognito requires the user pool email configuration to use Amazon SES
(`EmailSendingAccount=DEVELOPER`).

That means the prepared template is safe to keep in the repository, but applying
it in AWS should be done as a controlled console step.

## Image Requirement

Email clients cannot load a local project file such as:

```text
mobile/assets/traffiq-icon.png
```

The logo must be available from a public HTTPS URL.

The HTML template originally contains this placeholder:

```text
{{TRAFFIQ_LOGO_URL}}
```

Before pasting the template into Cognito, replace it with the final public HTTPS
URL of the icon.

Possible low-cost options:

- a public GitHub raw URL after the asset is pushed
- a small public static asset hosted from a controlled HTTPS location
- an S3 public object only if explicitly configured and cost-reviewed

For the license/demo scope, the safest first option is a public GitHub raw URL
if the repository is public.

## AWS Console Steps

Use these steps only after the final icon asset is pushed and the public logo URL
is known.

```text
AWS Console
-> Amazon Cognito
-> User pools
-> User pool - 02wbh
-> Messaging
-> Message templates
-> Verification message
```

Set the verification type to code, not link.

The email body must contain:

```text
{####}
```

Cognito replaces `{####}` with the real confirmation code.

## Cost And Security Notes

- Do not paste AWS credentials, Cognito tokens, or API keys into the template.
- Do not enable SMS verification for this task.
- Do not create a Lambda custom email sender for this task.
- If SES is used, keep it only for Cognito email delivery and monitor billing.
- If the sender remains Cognito default, the custom FROM address is not the goal
  of this task.

## Official References

- Cognito email settings:
  https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-email.html
- Cognito message templates:
  https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-settings-message-customizations.html
- Verification message template constraints:
  https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_VerificationMessageTemplateType.html
