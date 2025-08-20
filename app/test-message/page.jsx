'use client';

import Message from '../../components/Message';

export default function TestMessage() {
    const testMessages = [
        {
            _id: '1',
            role: 'user',
            content: 'Hello, can you help me with a table?'
        },
        {
            _id: '2',
            role: 'assistant',
            content: `Here's a sample table:

| Name | Age | City |
|------|-----|------|
| John | 25 | New York |
| Jane | 30 | London |
| Bob | 35 | Paris |

This table shows some sample data with names, ages, and cities.`
        },
        {
            _id: '3',
            role: 'assistant',
            content: `Here's some HTML content:

<div>
<table>
<thead>
<tr>
<th>Product</th>
<th>Price</th>
</tr>
</thead>
<tbody>
<tr>
<td>Apple</td>
<td>$1.00</td>
</tr>
<tr>
<td>Banana</td>
<td>$0.50</td>
</tr>
</tbody>
</table>
</div>

<p>This is a paragraph with some <strong>bold text</strong> and <em>italic text</em>.</p>

<p>This is another paragraph that contains nested elements like <span>spans</span> and <a href="#">links</a>.</p>`
        }
    ];

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Message Component Test</h1>
            <div className="space-y-4">
                {testMessages.map((message) => (
                    <Message 
                        key={message._id}
                        id={message._id}
                        role={message.role}
                        content={message.content}
                    />
                ))}
            </div>
        </div>
    );
}
