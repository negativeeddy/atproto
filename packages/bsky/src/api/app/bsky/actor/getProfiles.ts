import { mapDefined } from '@atproto/common'
import { Server } from '../../../../lexicon'
import { QueryParams } from '../../../../lexicon/types/app/bsky/actor/getProfiles'
import AppContext from '../../../../context'
import { setRepoRev } from '../../../util'
import { createPipeline, noRules } from '../../../../pipeline'
import { HydrationState, Hydrator } from '../../../../hydration/hydrator'
import { Views } from '../../../../views'

export default function (server: Server, ctx: AppContext) {
  const getProfile = createPipeline(skeleton, hydration, noRules, presentation)
  server.app.bsky.actor.getProfiles({
    auth: ctx.authVerifier.standardOptional,
    handler: async ({ auth, params, res }) => {
      const viewer = auth.credentials.iss

      const result = await getProfile({ ...params, viewer }, ctx)

      const repoRev = await ctx.hydrator.actor.getRepoRevSafe(viewer)
      setRepoRev(res, repoRev)

      return {
        encoding: 'application/json',
        body: result,
      }
    },
  })
}

const skeleton = async (input: {
  ctx: Context
  params: Params
}): Promise<SkeletonState> => {
  const { ctx, params } = input
  const dids = await ctx.hydrator.actor.getDidsDefined(params.actors)
  return { dids }
}

const hydration = async (input: {
  ctx: Context
  params: Params
  skeleton: SkeletonState
}) => {
  const { ctx, params, skeleton } = input
  return ctx.hydrator.hydrateProfilesDetailed(skeleton.dids, params.viewer)
}

const presentation = (input: {
  ctx: Context
  params: Params
  skeleton: SkeletonState
  hydration: HydrationState
}) => {
  const { ctx, skeleton, hydration } = input
  const profiles = mapDefined(skeleton.dids, (did) =>
    ctx.views.profileDetailed(did, hydration),
  )
  return { profiles }
}

type Context = {
  hydrator: Hydrator
  views: Views
}

type Params = QueryParams & {
  viewer: string | null
}

type SkeletonState = { dids: string[] }
