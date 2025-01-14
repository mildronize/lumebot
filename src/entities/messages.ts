import type { AzureTableEntityBase, AsyncEntityKeyGenerator } from '../libs/azure-table';
import type { SetOptional } from 'type-fest';
import { sha3 } from "hash-wasm";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

/**
 * Message History entity
 */
export interface IMessageEntity extends AzureTableEntityBase {
	/**
	 * Text or Photo URL (Photo URL may invalid after a certain time)
	 */
	payload: string;
	/**
	 * Telegram User ID
	 * Typically, it's a 10-digit number
	 */
	userId: string;
	createdAt: Date;
	/**
	 * Sender ID, User ID of the sender,
	 * If it's a bot, use `0` as the senderId
	 */
	senderId: string;
	/**
	 * Message type, text or photo
	 */
	type: 'text' | 'photo';
}

/**
 * Message History entity
 * - PartitionKey: `{YYYY}-{userId:20}` (Created Date) & UserId padding to 20 characters
 * - RowKey: `{YYYY}{MM}{DD}{HH}{mm}{ss}-{batchOrder:4}-{messageHash:10}` (Created Date, batchOrder padding to 4 & Message Hash with first 10 characters)
 */
export class MessageEntity implements AsyncEntityKeyGenerator<IMessageEntity> {

	constructor(private readonly _value: SetOptional<IMessageEntity, 'partitionKey' | 'rowKey' | 'createdAt'>) {
		if (!_value.createdAt) _value.createdAt = new Date();
	}

	get value(): IMessageEntity {
		if (!this._value.partitionKey || !this._value.rowKey) throw new Error('PartitionKey or RowKey is not set, please call `init()` method first');
		return this._value as IMessageEntity;
	}

	/**
	 * Initialize the entity with PartitionKey and RowKey,
	 * If `batchOrder` is set, it will be used to generate the RowKey,
	 * otherwise, `batchOrder` will be set to 0
	 * @param batchOrder
	 * @returns
	 */
	async init(batchOrder: number = 0): Promise<IMessageEntity> {
		this._value.partitionKey = await this.getPartitionKey();
		this._value.rowKey = await this.getRowKey(batchOrder);
		return this.value as IMessageEntity;
	}

	async getPartitionKey() {
		const object = this._value;
		return `${dayjs(object.createdAt).utc().format('YYYY')}-${object.userId.padStart(20, '0')}`;
	}

	async getRowKey(batchOrder: number = 0): Promise<string> {
		const object = this._value;
		if(batchOrder < 0 || batchOrder > 9999) throw new Error('batchOrder must be between 0 and 9999');
		return `${dayjs(object.createdAt).utc().format('YYYYMMDDHHmmss')}-${String(batchOrder).padStart(4, '0')}-${await this.hash(object.payload)}`;
	}

	async hash(message: string, limit = 10): Promise<string> {
		return (await sha3(message)).slice(0, limit);
	}

}
