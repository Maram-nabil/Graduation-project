// Utility class to apply API features (pagination, filtering, sorting, selection, search) to a Mongoose query
export class ApiFeature {
  // Initializes with a Mongoose query and URL query parameters
  constructor(mongooseQuery, urlQuery) {
    this.mongooseQuery = mongooseQuery;
    this.urlQuery = urlQuery;
    this.responseDetails = {};
    this._filters = {}; // store filters for counting
  }

  // Applies pagination to the Mongoose query based on URL parameters
  pagination() {
    const page = this.urlQuery.page * 1 || 1;
    const limit = this.urlQuery.limit * 1 || 10;
    const skip = (page - 1) * limit;
    // this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    this.responseDetails.page = page;
    this.responseDetails.limit = limit;
    this.responseDetails.skip = skip;
    return this;
  }

  // Applies filtering to the Mongoose query based on URL parameters
  filter() {
    let filters = structuredClone(this.urlQuery);
    // remove operators and wrap in Mongo syntax
    filters = JSON.stringify(filters).replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    filters = JSON.parse(filters);

    // exclude non-filter fields
    ['page', 'limit', 'fields', 'sort', 'search'].forEach(field => delete filters[field]);

    this._filters = filters; // save for counting
    this.mongooseQuery.find(filters);
    this.responseDetails.filters = filters;
    return this;
  }

  // Applies sorting to the Mongoose query based on URL parameters
  sort() {
    if (this.urlQuery.sort) {
      const sortBy = this.urlQuery.sort.split(',').join(' ');
      this.mongooseQuery.sort(sortBy);
      this.responseDetails.sortedBy = sortBy;
    }
    return this;
  }

  // Applies field selection to the Mongoose query based on URL parameters
  select() {
    if (this.urlQuery.fields) {
      const selectedBy = this.urlQuery.fields.split(',').join(' ');
      this.mongooseQuery.select(selectedBy);
      this.responseDetails.selectedBy = selectedBy;
    }
    return this;
  }

  // Applies search to the Mongoose query based on URL parameters
  search() {
    if (this.urlQuery.search) {
      const searchText = this.urlQuery.search.split(',').join(' ');
      this.mongooseQuery.find({ title: { $regex: searchText, $options: 'i' } });
      this.responseDetails.searchedBy = searchText;
    }
    return this;
  }

  // Automatically count total documents matching filters (before pagination)
  async getResponseDetails() {
    // if count not yet set, calculate it
    if (this.responseDetails.count == null) {
      // Use the model associated with the mongooseQuery
      const model = this.mongooseQuery.model;
      this.responseDetails.count = await model.countDocuments(this._filters);
    }
    return this.responseDetails;
  }
}
