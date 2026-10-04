import React from 'react';
import Link from 'next/link';
const NotFound = () => {
    return (
        <div>
            <Link href="/workspace">Back Home</Link>
            <h1>Workspace Not Found</h1>
            <p>The workspace you are looking for does not exist.</p>
        </div>
    );
};

export default NotFound;