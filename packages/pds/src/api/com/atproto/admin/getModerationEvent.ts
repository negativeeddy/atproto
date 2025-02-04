import { Server } from '../../../../lexicon'
import AppContext from '../../../../context'
import { authPassthru } from '../../../proxy'

export default function (server: Server, ctx: AppContext) {
  const { moderationAgent } = ctx
  if (!moderationAgent) return
  server.com.atproto.admin.getModerationEvent({
    auth: ctx.authVerifier.role,
    handler: async ({ req, params }) => {
      const { data } =
        await moderationAgent.com.atproto.admin.getModerationEvent(
          params,
          authPassthru(req),
        )
      return {
        encoding: 'application/json',
        body: data,
      }
    },
  })
}
