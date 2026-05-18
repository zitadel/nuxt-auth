import { eventHandler } from 'h3'

// noinspection JSUnusedGlobalSymbols
export default eventHandler(() => ({
  status: 'ok',
  message: 'This endpoint is public and requires no authentication.',
}))
