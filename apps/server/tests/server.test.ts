import app from '../src/index';
import { describe, it, expect } from 'vitest';

async function rpc(path: string, input?: unknown) {
	const urlPath = path.replace(/\./g, '/');
	const resp = await app.fetch(
		new Request(`http://localhost/rpc/${urlPath}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ json: input }),
		}),
	);
	const raw = (await resp.json()) as { json?: unknown };
	return { status: resp.status, body: raw.json };
}

describe('Server smoke test', () => {
	it('GET / returns hello message', async () => {
		const res = await app.fetch(new Request('http://localhost/'));
		expect(res.status).toBe(200);
		expect(await res.text()).toBe('Hello nn stack server!');
	});

	it('GET /rpc/planet/list returns 8 planets', async () => {
		const { status, body } = await rpc('planet.list');
		expect(status).toBe(200);
		const planets = body as Array<{ name: string }>;
		expect(planets).toHaveLength(8);
		expect(planets[0].name).toBe('Mercury');
	});
});

describe('Todos CRUD (D1 integration)', () => {
	it('creates and retrieves a todo', async () => {
		const { status: createStatus, body: created } = await rpc('todos.createTodo', {
			text: 'Test todo',
		});
		expect(createStatus).toBe(200);

		const todo = created as { id: number; text: string; completed: boolean };
		expect(todo.text).toBe('Test todo');
		expect(todo.completed).toBe(false);

		const { status: listStatus, body: todos } = await rpc('todos.getTodos');
		expect(listStatus).toBe(200);

		const allTodos = todos as Array<{ id: number; text: string }>;
		const found = allTodos.find((t) => t.id === todo.id);
		expect(found).toBeTruthy();
		expect(found?.text).toBe('Test todo');
	});
});
