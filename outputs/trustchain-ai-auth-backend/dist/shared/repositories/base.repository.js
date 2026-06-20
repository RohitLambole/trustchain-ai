"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    findById(id, projection) {
        return this.model.findById(id, projection).exec();
    }
    findOne(filter, projection) {
        return this.model.findOne(filter, projection).exec();
    }
    findMany(filter, limit = 50) {
        return this.model.find(filter).limit(limit).exec();
    }
    create(data) {
        return this.model.create(data);
    }
    updateById(id, update, options = { new: true }) {
        return this.model.findByIdAndUpdate(id, update, options).exec();
    }
    exists(filter) {
        return this.model.exists(filter).exec();
    }
}
exports.BaseRepository = BaseRepository;
