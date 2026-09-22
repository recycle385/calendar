import Joi from 'joi';

import { AnalysisPlan } from '../models/Analysis';

const voteStatuses = ['available', 'maybe', 'unavailable', 'no_vote', 'responded'] as const;
const operators = ['eq', 'gt', 'gte', 'lt', 'lte'] as const;

export const analysisPlanJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['ok', 'unsupported', 'ambiguous'] },
    reason: { type: ['string', 'null'] },
    target: { type: ['string', 'null'], enum: ['dates', 'participants', null] },
    participantScope: {
      type: 'object',
      additionalProperties: false,
      properties: {
        include: { type: 'array', items: { type: 'string' }, maxItems: 20 },
        exclude: { type: 'array', items: { type: 'string' }, maxItems: 20 },
      },
      required: ['include', 'exclude'],
    },
    dateScope: {
      type: 'object',
      additionalProperties: false,
      properties: {
        dates: { type: 'array', items: { type: 'string' }, maxItems: 31 },
        weekdays: {
          type: 'array',
          items: { type: 'integer', minimum: 0, maximum: 6 },
          maxItems: 7,
        },
        from: { type: ['string', 'null'] },
        to: { type: ['string', 'null'] },
      },
      required: ['dates', 'weekdays', 'from', 'to'],
    },
    conditions: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: {
            type: 'string',
            enum: ['participant_status', 'date_status', 'count', 'ratio'],
          },
          ref: { type: ['string', 'null'] },
          statuses: {
            type: 'array',
            items: { type: 'string', enum: [...voteStatuses] },
            minItems: 1,
            maxItems: 5,
          },
          negate: { type: 'boolean' },
          operator: { type: ['string', 'null'], enum: [...operators, null] },
          value: { type: ['number', 'null'] },
          denominator: {
            type: ['string', 'null'],
            enum: ['scoped_participants', 'responded', null],
          },
        },
        required: ['type', 'ref', 'statuses', 'negate', 'operator', 'value', 'denominator'],
      },
    },
    conditionLogic: { type: 'string', enum: ['all', 'any'] },
    output: {
      type: 'object',
      additionalProperties: false,
      properties: {
        kind: {
          type: ['string', 'null'],
          enum: ['list', 'count', 'ratio', 'rank', 'summary', 'compare', null],
        },
        metric: {
          type: ['string', 'null'],
          enum: [...voteStatuses, 'default_rank', null],
        },
        direction: { type: ['string', 'null'], enum: ['max', 'min', null] },
        limit: { type: ['integer', 'null'], minimum: 1, maximum: 20 },
        position: { type: ['string', 'null'], enum: ['earliest', 'latest', null] },
        includeTies: { type: 'boolean' },
      },
      required: ['kind', 'metric', 'direction', 'limit', 'position', 'includeTies'],
    },
  },
  required: [
    'status',
    'reason',
    'target',
    'participantScope',
    'dateScope',
    'conditions',
    'conditionLogic',
    'output',
  ],
} as const;

const planSchema = Joi.object({
  status: Joi.string().valid('ok', 'unsupported', 'ambiguous').required(),
  reason: Joi.string().allow(null).required(),
  target: Joi.string().valid('dates', 'participants').allow(null).required(),
  participantScope: Joi.object({
    include: Joi.array().items(Joi.string()).max(20).required(),
    exclude: Joi.array().items(Joi.string()).max(20).required(),
  }).required(),
  dateScope: Joi.object({
    dates: Joi.array().items(Joi.string()).max(31).required(),
    weekdays: Joi.array().items(Joi.number().integer().min(0).max(6)).max(7).required(),
    from: Joi.string().allow(null).required(),
    to: Joi.string().allow(null).required(),
  }).required(),
  conditions: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().valid('participant_status', 'date_status', 'count', 'ratio').required(),
        ref: Joi.string().allow(null).required(),
        statuses: Joi.array().items(Joi.string().valid(...voteStatuses)).min(1).max(5).required(),
        negate: Joi.boolean().required(),
        operator: Joi.string().valid(...operators).allow(null).required(),
        value: Joi.number().allow(null).required(),
        denominator: Joi.string().valid('scoped_participants', 'responded').allow(null).required(),
      })
    )
    .max(10)
    .required(),
  conditionLogic: Joi.string().valid('all', 'any').required(),
  output: Joi.object({
    kind: Joi.string().valid('list', 'count', 'ratio', 'rank', 'summary', 'compare').allow(null).required(),
    metric: Joi.string().valid(...voteStatuses, 'default_rank').allow(null).required(),
    direction: Joi.string().valid('max', 'min').allow(null).required(),
    limit: Joi.number().integer().min(1).max(20).allow(null).required(),
    position: Joi.string().valid('earliest', 'latest').allow(null).required(),
    includeTies: Joi.boolean().required(),
  }).required(),
}).options({ abortEarly: false, allowUnknown: false, stripUnknown: false });

export function validateAnalysisPlanSchema(input: unknown): AnalysisPlan {
  const { error, value } = planSchema.validate(input);
  if (error) {
    throw new Error(`LLM 분석 계획 스키마 오류: ${error.details.map((item: { message: string }) => item.message).join(', ')}`);
  }
  return value as AnalysisPlan;
}
