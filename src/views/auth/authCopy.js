/**
 * Auth copy (brief 4.0). Strings also in the mockup's v4auth.js are
 * word for word from there (brief's Copy rule). Strings cycle 14
 * added beyond the mockup (email-not-confirmed, kit email-mismatch/
 * already-linked/other errors, 60s resend wait, password-changed
 * banner) are drafted here in the same voice — Spanish on these is a
 * draft, not yet Amina-reviewed (brief 11.6), same status as any new
 * app string.
 */
export const AUTH_COPY = {
  en: {
    privacy: "Your results are private. Only you and your nutritionist can see them.",
    email: "Email", password: "Password", show: "Show", hide: "Hide",

    signInTitle: "Welcome back", signInSub: "Sign in to see your plan and your gut results.",
    forgot: "Forgot your password?", signInButton: "Sign in",
    signInError: "That email and password don't match. Try again, or reset your password.",
    emailNotConfirmed: "Confirm your email first. We've sent you a link.",
    newToElevame: "New to Elevame?", createAccount: "Create your account",

    createTitle: "Create your account", createSub: "Use the email your kit was registered with. You'll link your kit on the next step.",
    passwordHint: "At least 8 characters.", createButton: "Create account",
    haveAccount: "Already have an account?", signIn: "Sign in",

    checkInboxTitle: "Check your inbox",
    createSent: email => `We've sent a link to ${email}. Tap it to confirm your email, then come back here to sign in.`,
    resend: "Didn't get it? Send it again", resendWait: n => `You can send another in ${n} s.`, backToSignIn: "Back to sign in",

    linkStep: "Step 2 of 2", linkTitle: "Link your kit", linkSub: "Your kit code is on the box and in the email with your results. It starts with ELV.",
    kitCode: "Kit code", emailOnFile: "Email on file", linkButton: "Link my kit",
    errorNotFound: "We couldn't find a kit with that code. Check the letters and numbers, or message your nutritionist.",
    errorEmailMismatch: "That code is registered to a different email. Use the email your kit was registered with, or message your nutritionist.",
    errorAlreadyClaimed: "This kit is already linked to an account. Sign in with that account, or message your nutritionist.",
    errorGeneric: "Something went wrong. Try again in a minute.",
    cantFindCode: "Can't find your code?", messageNutritionist: "Message your nutritionist", signOut: "Sign out",

    forgotTitle: "Reset your password", forgotSub: "Enter your email and we'll send you a link to choose a new password.",
    forgotButton: "Send me a link",
    forgotSent: email => `If ${email} has an account, a reset link is on its way. It works for one hour.`,

    resetTitle: "Choose a new password", resetButton: "Save new password",
    passwordChanged: "Password changed. Sign in with your new password.",

    confirmExpired: "This link has expired or was already used.", sendNewLink: "Send a new link",
    confirming: "Confirming…",
  },
  es: {
    privacy: "Tus resultados son privados. Solo tú y tu nutricionista podéis verlos.",
    email: "Correo electrónico", password: "Contraseña", show: "Ver", hide: "Ocultar",

    signInTitle: "Hola de nuevo", signInSub: "Inicia sesión para ver tu plan y los resultados de tu intestino.",
    forgot: "¿Has olvidado tu contraseña?", signInButton: "Iniciar sesión",
    signInError: "El correo y la contraseña no coinciden. Vuelve a intentarlo o restablece tu contraseña.",
    emailNotConfirmed: "Confirma primero tu correo. Te hemos enviado un enlace.",
    newToElevame: "¿Primera vez en Elevame?", createAccount: "Crea tu cuenta",

    createTitle: "Crea tu cuenta", createSub: "Usa el correo con el que se registró tu kit. En el siguiente paso vincularás tu kit.",
    passwordHint: "Al menos 8 caracteres.", createButton: "Crear cuenta",
    haveAccount: "¿Ya tienes cuenta?", signIn: "Inicia sesión",

    checkInboxTitle: "Revisa tu correo",
    createSent: email => `Hemos enviado un enlace a ${email}. Púlsalo para confirmar tu correo y vuelve aquí para iniciar sesión.`,
    resend: "¿No te ha llegado? Envíalo de nuevo", resendWait: n => `Puedes enviar otro en ${n} s.`, backToSignIn: "Volver a iniciar sesión",

    linkStep: "Paso 2 de 2", linkTitle: "Vincula tu kit", linkSub: "El código de tu kit está en la caja y en el correo con tus resultados. Empieza por ELV.",
    kitCode: "Código del kit", emailOnFile: "Correo registrado", linkButton: "Vincular mi kit",
    errorNotFound: "No encontramos ningún kit con ese código. Revisa las letras y los números o escribe a tu nutricionista.",
    errorEmailMismatch: "Ese código está registrado con otro correo. Usa el correo con el que se registró tu kit, o escribe a tu nutricionista.",
    errorAlreadyClaimed: "Este kit ya está vinculado a una cuenta. Inicia sesión con esa cuenta, o escribe a tu nutricionista.",
    errorGeneric: "Algo salió mal. Inténtalo de nuevo en un minuto.",
    cantFindCode: "¿No encuentras tu código?", messageNutritionist: "Escribe a tu nutricionista", signOut: "Cerrar sesión",

    forgotTitle: "Restablece tu contraseña", forgotSub: "Escribe tu correo y te enviaremos un enlace para elegir una contraseña nueva.",
    forgotButton: "Envíame el enlace",
    forgotSent: email => `Si ${email} tiene una cuenta, el enlace ya está en camino. Funciona durante una hora.`,

    resetTitle: "Elige una contraseña nueva", resetButton: "Guardar nueva contraseña",
    passwordChanged: "Contraseña cambiada. Inicia sesión con tu nueva contraseña.",

    confirmExpired: "Este enlace ha caducado o ya se usó.", sendNewLink: "Enviar un enlace nuevo",
    confirming: "Confirmando…",
  },
};
