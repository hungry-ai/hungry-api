const mongoose = require("mongoose");
const { Schema } = mongoose;

const restaurantSchema = new Schema(
  {
    name: String,
    images: [{ type: Schema.Types.ObjectId, ref: "Image" }],
  },
  { timestamps: true }
);

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

const addressComponentSchema = new Schema({
  long_name: String,
  short_name: String,
  types: [String],
});

const placeOpeningHoursPeriodDetailSchema = new Schema({
  day: Number,
  time: String,
  date: String,
  truncated: Boolean,
});

const placeOpeningHoursPeriodSchema = new Schema({
  open: placeOpeningHoursPeriodDetailSchema,
  close: placeOpeningHoursPeriodDetailSchema,
});

const placeSpecialDaySchema = new Schema({
  date: String,
  exceptional_hours: Boolean,
});

const placeOpeningHoursSchema = new Schema({
  open_now: Boolean,
  periods: [placeOpeningHoursPeriodSchema],
  special_days: [placeSpecialDaySchema],
  type: String,
  weekday_text: [String],
});

const placeEditorialSummarySchema = new Schema({
  language: String,
  overview: String,
});

const latLngLiteralSchema = new Schema({ lat: Number, lng: Number });

const boundsSchema = new Schema({
  northeast: latLngLiteralSchema,
  southwest: latLngLiteralSchema,
});

const geometrySchema = new Schema({
  location: latLngLiteralSchema,
  bounds: boundsSchema,
});

const placePhotoSchema = new Schema({
  height: Number,
  html_attributions: [String],
  photo_reference: String,
  width: Number,
});

const plusCodeSchema = new Schema({
  global_code: String,
  compound_code: String,
});

const placeReviewSchema = new Schema({
  author_name: String,
  rating: Number,
  relative_time_description: String,
  time: Number,
  author_url: String,
  language: String,
  original_language: String,
  profile_photo_url: String,
  text: String,
  translated: Boolean,
});

const googleRestaurantSchema = new Schema(
  {
    zip: String,
    address_components: [addressComponentSchema],
    adr_address: String,
    business_status: String,
    curbside_pickup: Boolean,
    current_opening_hours: placeOpeningHoursSchema,
    delivery: Boolean,
    dine_in: Boolean,
    editorial_summary: placeEditorialSummarySchema,
    formatted_address: String,
    formatted_phone_number: String,
    geometry: geometrySchema,
    icon: String,
    icon_background_color: String,
    icon_mask_base_uri: String,
    international_phone_number: String,
    name: String,
    opening_hours: placeOpeningHoursSchema,
    permanently_closed: Boolean,
    photos: [placePhotoSchema],
    place_id: String,
    plus_code: plusCodeSchema,
    price_level: Number,
    reference: String,
    reservable: Boolean,
    reviews: [placeReviewSchema],
    scope: String,
    secondary_opening_hours: [placeOpeningHoursSchema],
    serves_beer: Boolean,
    serves_breakfast: Boolean,
    serves_brunch: Boolean,
    serves_dinner: Boolean,
    serves_lunch: Boolean,
    serves_vegetarian_food: Boolean,
    serves_wine: Boolean,
    takeout: Boolean,
    types: [String],
    url: String,
    user_ratings_total: Number,
    utc_offset: Number,
    vicinity: String,
    website: String,
    wheelchair_accessible_entrance: Boolean,
  },
  { timestamps: true }
);

const GoogleRestaurant = mongoose.model(
  "GoogleRestaurant",
  googleRestaurantSchema
);

module.exports = { Restaurant, GoogleRestaurant };
