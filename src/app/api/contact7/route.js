import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Contact7 from '@/lib/models/Contact7';

// Hardcoded API Key for CF7 Webhook authentication
const CF7_API_KEY = "my_secure_api_key_123";

// Helper function to authenticate the request from CF7
async function authenticateCF7(req) {
    const authHeader = req.headers.get('authorization');
    
    // If no authorization header is provided, reject unless no credentials are set
    if (!authHeader) {
        if (!process.env.CF7_USERNAME && !CF7_API_KEY) {
            console.warn("WARNING: CF7 API is receiving requests without authentication.");
            return true; // Allow if no environment variables are configured (for ease of testing)
        }
        return false;
    }

    // Check Basic Auth
    if (authHeader.startsWith('Basic ')) {
        const base64Credentials = authHeader.split(' ')[1];
        try {
            const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
            const [username, password] = credentials.split(':');
            
            if (process.env.CF7_USERNAME && process.env.CF7_PASSWORD) {
                if (username === process.env.CF7_USERNAME && password === process.env.CF7_PASSWORD) {
                    return true;
                }
            } else {
                console.warn("Basic auth header received, but CF7_USERNAME and CF7_PASSWORD are not set in .env.");
            }
        } catch (error) {
            console.error('Error decoding basic auth:', error);
        }
    }
    
    // Check Bearer Token or custom API Key Header
    if (CF7_API_KEY) {
        if (authHeader === CF7_API_KEY) return true;
        if (authHeader.startsWith('Bearer ') && authHeader.split(' ')[1] === CF7_API_KEY) return true;
    }

    return false;
}

// Helper function to create a contact from the extracted data
async function createContactFromCF7(data, req) {
    await dbConnect();
    
    // Clean empty strings from data
    Object.keys(data).forEach(key => {
        if (data[key] === "" || data[key] === null) {
            delete data[key];
        }
    });

    // Map the incoming CF7 fields to the Contact7Schema fields
    const contactData = {
        name: data.name || data.firstName || data.first_name || 'CF7 User',
        email: data.email || null,
        phone: data.phone || data.mobile || null,
        subject: data.subject || null,
        message: data.message || data.notes || null,
        consent: data.consent === true || data.consent === 'true' || data.consent === 'on' || data.consent === '1' || data.consent === 1
    };

    // Only set optional fields if they exist to avoid validation errors
    if (!contactData.email) delete contactData.email;
    if (!contactData.phone) delete contactData.phone;
    if (!contactData.subject) delete contactData.subject;
    if (!contactData.message) delete contactData.message;

    const newContact = await Contact7.create(contactData);

    return newContact;
}

// POST API for CF7 JSON/Form Data submissions
export async function POST(req) {
    try {
        const isAuthenticated = await authenticateCF7(req);
        if (!isAuthenticated) {
             return NextResponse.json({ status: 'error', message: 'Unauthorized. Invalid API Key or Basic Auth.' }, { status: 401 });
        }

        let body = {};
        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            try {
                body = await req.json();
            } catch (e) {
                return NextResponse.json({ status: 'error', message: 'Invalid JSON payload' }, { status: 400 });
            }
        } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            formData.forEach((value, key) => {
                body[key] = value;
            });
        } else {
             // Fallback attempt to parse JSON
             try {
                 body = await req.json();
             } catch(e) {
                 // If it fails, proceed with an empty body
             }
        }

        if (Object.keys(body).length === 0) {
             return NextResponse.json({ status: 'error', message: 'No data provided in the request body' }, { status: 400 });
        }

        const newContact = await createContactFromCF7(body, req);

        return NextResponse.json({
            status: 'success',
            message: 'Contact created successfully via POST',
            data: { id: newContact._id }
        }, { status: 201 });

    } catch (error) {
        console.error('CF7 API POST Error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 400 });
    }
}

// GET API for CF7 URL Query Parameter submissions
export async function GET(req) {
    try {
        const isAuthenticated = await authenticateCF7(req);
        if (!isAuthenticated) {
             return NextResponse.json({ status: 'error', message: 'Unauthorized. Invalid API Key or Basic Auth.' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const data = Object.fromEntries(searchParams.entries());

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ 
                status: 'success', 
                message: 'CF7 GET API is active. Send data as query parameters to create a contact.' 
            }, { status: 200 });
        }

        const newContact = await createContactFromCF7(data, req);

        return NextResponse.json({
            status: 'success',
            message: 'Contact created successfully via GET',
            data: { id: newContact._id }
        }, { status: 201 });

    } catch (error) {
        console.error('CF7 API GET Error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 400 });
    }
}
