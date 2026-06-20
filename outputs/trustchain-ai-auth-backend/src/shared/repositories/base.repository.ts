import type { FilterQuery, Model, QueryOptions, UpdateQuery } from "mongoose";

export class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  findById(id: string, projection?: Record<string, unknown>) {
    return this.model.findById(id, projection).exec();
  }

  findOne(filter: FilterQuery<T>, projection?: Record<string, unknown>) {
    return this.model.findOne(filter, projection).exec();
  }

  findMany(filter: FilterQuery<T>, limit = 50) {
    return this.model.find(filter).limit(limit).exec();
  }

  create(data: Partial<T>) {
    return this.model.create(data);
  }

  updateById(id: string, update: UpdateQuery<T>, options: QueryOptions = { new: true }) {
    return this.model.findByIdAndUpdate(id, update, options).exec();
  }

  exists(filter: FilterQuery<T>) {
    return this.model.exists(filter).exec();
  }
}
