import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let testEnv: any;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-test-project',
    firestore: {
      rules: readFileSync(resolve(__dirname, 'DRAFT_firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Competitor Images Rules', () => {
  it('allows owner to create valid image', async () => {
    const db = testEnv.authenticatedContext('user_123', { email: 'test@test.com', email_verified: true }).firestore();
    await assertSucceeds(
      db.collection('users').doc('user_123').collection('competitorImages').doc('image_1').set({
        userId: 'user_123',
        categoryId: 'cat_1',
        data: 'base64str',
        parsedData: { brand: 'test' },
        createdAt: 123456789,
        updatedAt: 123456789
      })
    );
  });

  it('denies creation with missing field', async () => {
    const db = testEnv.authenticatedContext('user_123', { email: 'test@test.com', email_verified: true }).firestore();
    await assertFails(
      db.collection('users').doc('user_123').collection('competitorImages').doc('image_1').set({
        userId: 'user_123',
        categoryId: 'cat_1',
        data: 'base64str',
        createdAt: 123456789,
        updatedAt: 123456789
      })
    );
  });
});
