export async function loader() {
    return Response.json({
        users: [
            { id: 1, name: "John Doe" },
            { id: 2, name: "Jane Doe" },
        ],
    });
}
