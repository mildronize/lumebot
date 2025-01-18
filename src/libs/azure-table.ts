import { ListTableEntitiesOptions, TableClient, TableServiceClientOptions, TableTransaction } from '@azure/data-tables';
import chunk from 'lodash.chunk';
export interface AzureTableEntityBase {
  partitionKey: string;
  rowKey: string;
}

export type InferAzureTable<T> = T extends AzureTable<infer U> ? U : never;

/**
 * Async Entity Key Generator
 * - PartitionKey & RowKey are generated asynchronously
 * - The value is only available after calling `init()` method
 *
 * Example:
 * ```typescript
 * class MessageEntity implements AsyncEntityKeyGenerator<IMessageEntity> { ... }
 * const entity = await new MessageEntity({ message: 'Hello', userId: '1234567890' }).init();
 * // Result: { partitionKey: '2021-1234567890', rowKey: '202101010', message: 'Hello', userId: '1234567890', createdAt: '2021-01-01T00:00:00.000Z' }
 * ```
 */
export interface AsyncEntityKeyGenerator<T> {
  getPartitionKey: () => Promise<string>;
  getRowKey: () => Promise<string>;
  init: () => Promise<T>;
  value: T;
}

/**
 * Entity Key Generator
 * - PartitionKey & RowKey are generated synchronously
 *
 * Example:
 * ```typescript
 * class MessageEntity implements EntityKeyGenerator<IMessageEntity> { ... }
 * const entity = new MessageEntity({ message: 'Hello', userId: '1234567890' })
 * // Result: { partitionKey: '2021-1234567890', rowKey: '202101010', message: 'Hello', userId: '1234567890', createdAt: '2021-01-01T00:00:00.000Z' }
 * ```
 */
export interface EntityKeyGenerator<T> {
  getPartitionKey: () => string;
  getRowKey: () => string;
  value: T;
}

/**
 * Generic Azure Table class
 */
export class AzureTable<TEntity extends AzureTableEntityBase> {
  /**
   * The transaction can include at most 100 entities.
   * @see https://learn.microsoft.com/en-us/rest/api/storageservices/performing-entity-group-transactions#requirements-for-entity-group-transactions
   */
  public readonly maxBatchChange: number = 100;

  constructor(public readonly client: TableClient) {}

  async createTable() {
    return this.client.createTable();
  }

  /**
   * Query entities
   * TODO: may fix type safety later
   *
   * select prop type may incorrect
   */
  list(queryOptions?: ListTableEntitiesOptions['queryOptions'], listTableEntitiesOptions?: Omit<ListTableEntitiesOptions, 'queryOptions'>) {
    return this.client.listEntities<TEntity>({
      ...listTableEntitiesOptions,
      queryOptions,
    });
  }

  async listAll(
    queryOptions?: ListTableEntitiesOptions['queryOptions'],
    listTableEntitiesOptions?: Omit<ListTableEntitiesOptions, 'queryOptions'>,
  ) {
    const entities = this.list(queryOptions, listTableEntitiesOptions);
    const result = [];
    // List all the entities in the table
    for await (const entity of entities) {
      result.push(entity);
    }
    return result;
  }

  async count(
    queryOptions?: ListTableEntitiesOptions['queryOptions'],
    listTableEntitiesOptions?: Omit<ListTableEntitiesOptions, 'queryOptions'>,
  ) {
    let count = 0;
    const entities = this.list(queryOptions, listTableEntitiesOptions);
    // List all the entities in the table
    for await (const _ of entities) {
      count++;
    }
    return count;
  }

  async insert(entity: TEntity) {
    return this.client.createEntity<TEntity>(entity);
  }

  /**
   * All operations in a transaction must target the same partitionKey
   */

  async insertBatch(rawEntities: TEntity[]) {
    const groupByPartitionKey = this.groupPartitionKey(rawEntities);
    for (const entities of Object.values(groupByPartitionKey)) {
      const entityChunks = chunk(entities, this.maxBatchChange);
      for (const entityChunk of entityChunks) {
        const transaction = new TableTransaction();
        entityChunk.forEach((entity) => transaction.createEntity(entity));
        await this.client.submitTransaction(transaction.actions);
      }
    }
  }

  /**
   * All operations in a transaction must target the same partitionKey
   */
  async upsertBatch(rawEntities: TEntity[]) {
    const groupByPartitionKey = this.groupPartitionKey(rawEntities);
    for (const entities of Object.values(groupByPartitionKey)) {
      const entityChunks = chunk(entities, this.maxBatchChange);
      for (const entityChunk of entityChunks) {
        const transaction = new TableTransaction();
        entityChunk.forEach((entity) => transaction.upsertEntity(entity));
        await this.client.submitTransaction(transaction.actions);
      }
    }
  }

  async deleteBatch(rawEntities: TEntity[]) {
    const groupByPartitionKey = this.groupPartitionKey(rawEntities);
    for (const entities of Object.values(groupByPartitionKey)) {
      const entityChunks = chunk(entities, this.maxBatchChange);
      for (const entityChunk of entityChunks) {
        const transaction = new TableTransaction();
        entityChunk.forEach((entity) => {
          const { partitionKey, rowKey } = entity;
          transaction.deleteEntity(partitionKey, rowKey);
        });
        await this.client.submitTransaction(transaction.actions);
      }
    }
  }

  /**
   * Group entities by partitionKey
   * Becasue all operations in a transaction must target the same partitionKey
   *
   * @param entities
   * @returns
   */
  groupPartitionKey(entities: TEntity[]) {
    return entities.reduce(
      (acc, cur) => {
        if (!acc[cur.partitionKey]) {
          acc[cur.partitionKey] = [];
        }
        acc[cur.partitionKey].push(cur);
        return acc;
      },
      {} as Record<string, TEntity[]>,
    );
  }
}
