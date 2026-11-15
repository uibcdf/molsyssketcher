# Draft Conda resource package

The maintainer selected Conda as the public distribution route. The current
TypeScript-only payload proposes `noarch: generic`, with ESM, declarations,
license, metadata and an integrity manifest below
`$PREFIX/share/molsyssketcher`. Node is a build/test tool; browser consumption
does not require installing Node or an unused Python facade.

The suite's current publication profiles need central receiving for this
generic JavaScript/resource kind under
[MolSysSuite #199](https://github.com/uibcdf/molsyssuite/issues/199#issuecomment-6890741865).
See the [official Conda metadata documentation](https://docs.conda.io/projects/conda-build/en/stable/resources/define-metadata.html#architecture-independent-packages).
No publisher/upload workflow is enabled. A future supported Python bridge
would need its own actual API/dependencies and a reviewed artifact profile.

`npm run pack:conda:check` tests resource staging, relocation, file digests,
canonical version identity and installed-prefix ESM imports. It is a local
layout check, not a conda-build, solver or installed Conda archive test.

The draft recipe requires an explicit `MOLSYSSKETCHER_VERSION` in canonical
`X.Y.Z`, equal to `package.json`; `0.0.0` remains the private development
placeholder. Node 24.22.1/npm 11.19.1 and the committed npm lockfile are build
inputs. Before a public release, receive the central profile, pin the actual
conda-build/publisher tools, render/build/test the exact archive outside source,
verify all claimed hosts/assets and public dependency closure, and prepare the
reviewed staging/promotion plan and required independent verification. Public
tags and GitHub Release titles must also be exactly `X.Y.Z`, without a prefix
or suffix. No public release version or installation command is selected here.
