"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";

const getUserByEmail = async (email: string) => {
    const { databases } = await createAdminClient();

    const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("email", [email])]
    );

    return result.total > 0 ? result.documents[0] : null;
}

const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
}

const sendEmailOTP = async ({ email }: { email: string }) => {
    const { account } = await createAdminClient();

    try {
        const session = await account.createEmailToken(ID.unique(), email);

        return session.userId;
    } catch (error) {
        handleError(error, "Failed to send email OTP");
    }
}

export const createAccount = async ({ 
    fullName, 
    email 
}: { 
    fullName: string; 
    email: string; 
}) => { 
    const existingUser = await getUserByEmail(email);

    const accountId = await sendEmailOTP({ email });
    if (!accountId) throw new Error("failed to send an OTP");

    if (!existingUser) {
        const { databases } = await createAdminClient();

        await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            ID.unique(),
            {
                fullName,
                email,
                avatar: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAMAAABC4vDmAAAAbFBMVEX///8uNDYnLjBjZmcqMDLs7OwdJSdQVFYAAACjpKUXICMgKCobIyYjKiwSHB/8/PxucXIEExeWmJnP0NDy8vI3PD4AAAp0dneGiIlpbG22uLipqqvAwcF8f3/Gx8fa29sACxA+Q0VGS0yOkJGLGkrqAAAEI0lEQVR4nO2c2ZaiMBCGm7AIISSyyaKI4vu/48Dp4bTt2FKJVMGZ5rv24j9JpXb8+NjY2NjYWATlnoJmb1dVE5zdbGk1A27d5H4sw4ixKJQXPy9rd1lFqi1y4TnWHY4n8qZVy2lKi4NnPcG7FOlCktxGhM8kDYRhs4hxpTn/SdIAv9IflkpC9kqTZbEooNZUXl5LGjgktJr2L69uRDaUr7CMIZos60J4VjcJ09SfFZldpQeopt6uWhpNbu5MixlxOpqg0wi4pt5f3Sg0pb6OJsvyCY5K7Sec5iNRgy/qDH55IwI/3uyf5gWv4CW2pkzTogZ8bFFH7duzrPiELKrQNPOBqMDV5O40HOeIs8P1Cu2PueYrGG6sOQPTg+/EZ1RRgYGd97nCEVVUqRX3RpDjX2FkUyHu86vMRFW/T9Qqr8/M0D3ckGzoEnDLh1U6zzYyERXhhplVBuSPxuCo0LP02sDSZY0sSgG6LY9c0Nsc+oWDt8fWZPD+kN/egKo0s3RWETSp2hWW7X1QBnXxRjhB1d7jdlqtIKLWtU7fxSdrXCfgC+SEbesG6Nclem/jngKkSiLX64+UAFW05zQQ8Ik36NC1q79I85dRUOSLTNeyW/zzaC2+LTW3bW329LQEq4h6+k9JyzCOvo9rozgsl5qLjmR1dbUEF14Yeh4XVrevVzFwz9L6mDRFU96COl2Foo2NjY21ojL3NVlGuhqk0rosKns3gV0VZU0SmN3TzfIvMmSMORP0Pwnlwb8mZ9xyNC06OZVxPsK47PDWqdpA+JFBI29IZ3x2xDiu7JZLI0V/dclrMncCkSWxUQf9XhaXwayyzp1R//wfWbv5bCsr/Tcu7h7mz1VPtN27N3eHmKd9XXODAfvPROEMCwGTlbAuDn97eAvpGegi31yKgy+60anC0fSeqqPRIA1CbDwZOWsPF+AwQzeavRPrpnC4kRdVttHAEYpXmCSmCZKRj5jsmrgGK2V6xNoXqPaolzcQ7XUv8Kw1gDGD6w7hrVmj8HNYrnlQaG7zHr19hcwmOKj+qGwdq0oJLGpA6NSq+tNrM3Rm3grZb34h4fdXE91e7xXg2YLJ7ogZIXjQ5V4R04PvwL82aMlMqjcq6PszWyczI4bmChWZSWnsEDIyk+qNChj/1IxV+jQc5qlaInf+iYA9P8wi5okoWFlTk4ryYP2OI60omE8INlEebKViE7WJ+hWiVumnTqQBGejRW1JR0NKPMPHs82GYJtrME1qO1iTdjU/AbeJVllgfCZlTEPAuvxJER+WEGr0gk88rTND6JEM1JC0OzZVZ1RGYldhptoczG/2spK3fSMdWxbUanqOqo0S8QmH62VHbMIHSJWbCacyH7mnSHWIeRWw2oojHl13y3gaTcuukqOzZqIrk5C74R1AbGxsb/y9/AA/YTo7pDAqAAAAAAElFTkSuQmCC",
                accountId,
            }
        )
    }

    return parseStringify({ accountId });
};