# Releasing @compassfoodtech/mcp

The source of truth is `compass-mcp/` in the private Compass monorepo. Tests run
there. The public repo `github.com/compass-food/compass-mcp` is an exact mirror
and the only place npm publishing runs, because npm attaches provenance only to
packages built from a public repository.

## Every release

1. In the monorepo, bump `version` in `package.json` and `package-lock.json`,
   add a `CHANGELOG.md` entry, and merge the PR (CI runs the MCP tests).
2. Mirror the merged tree into a clean checkout of the public repo:

   ```bash
   node scripts/compass/sync-mcp-public-repo.mjs <path-to-public-checkout>
   ```

   Commit on a branch there, open a PR, and merge it after its CI passes.
3. Tag the merged public commit with the exact version and push the tag:

   ```bash
   git tag v0.4.1 && git push origin v0.4.1
   ```

   `.github/workflows/publish.yml` waits for approval on the `npm-publish`
   environment, checks that the tag matches `package.json`, builds, checks the
   tool list, and publishes with npm trusted publishing. No npm token is stored
   anywhere.
4. Check `https://www.npmjs.com/package/@compassfoodtech/mcp` shows the new
   version with a provenance badge.

## npm settings

- Trusted publisher: GitHub Actions, organization `compass-food`, repository
  `compass-mcp`, workflow `publish.yml`, environment `npm-publish`, direct
  publish allowed.
- GitHub environment `npm-publish` in the public repo has the package owner as
  required reviewer, so each tag waits for that approval before publishing.
- Publishing access: "Require two-factor authentication and disallow tokens".
