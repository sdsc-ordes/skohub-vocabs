import { _pruneTreeByScheme as pruneTreeByScheme } from "../gatsby-node"

describe("pruneTreeByScheme", () => {
  it("returns null/undefined unchanged for falsy input", () => {
    const allowed = new Set(["a"])
    expect(pruneTreeByScheme(null, allowed)).toBeNull()
    expect(pruneTreeByScheme(undefined, allowed)).toBeUndefined()
    expect(pruneTreeByScheme([], allowed)).toEqual([])
  })

  it("filters top-level items not in allowedIds", () => {
    const items = [
      { id: "a", prefLabel: { en: "A" }, narrower: null },
      { id: "b", prefLabel: { en: "B" }, narrower: null },
      { id: "c", prefLabel: { en: "C" }, narrower: null },
    ]
    const allowed = new Set(["a", "c"])
    const result = pruneTreeByScheme(items, allowed)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.id)).toEqual(["a", "c"])
  })

  it("recursively prunes narrower children", () => {
    const items = [
      {
        id: "top1",
        prefLabel: { en: "Top 1" },
        narrower: [
          {
            id: "child1",
            prefLabel: { en: "Child 1 (in scheme)" },
            narrower: null,
          },
          {
            id: "child2",
            prefLabel: { en: "Child 2 (not in scheme)" },
            narrower: null,
          },
        ],
      },
    ]
    const allowed = new Set(["top1", "child1"])
    const result = pruneTreeByScheme(items, allowed)
    expect(result).toHaveLength(1)
    expect(result[0].narrower).toHaveLength(1)
    expect(result[0].narrower[0].id).toBe("child1")
  })

  it("prunes deeply nested narrower trees", () => {
    const items = [
      {
        id: "a",
        narrower: [
          {
            id: "b",
            narrower: [
              {
                id: "c",
                narrower: [
                  { id: "d-keep", narrower: null },
                  { id: "d-remove", narrower: null },
                ],
              },
            ],
          },
        ],
      },
    ]
    const allowed = new Set(["a", "b", "c", "d-keep"])
    const result = pruneTreeByScheme(items, allowed)
    expect(result[0].narrower[0].narrower[0].narrower).toHaveLength(1)
    expect(result[0].narrower[0].narrower[0].narrower[0].id).toBe("d-keep")
  })

  it("removes a top-level concept if it is not in the scheme", () => {
    const items = [
      {
        id: "shared-top",
        narrower: [{ id: "child-in-scheme", narrower: null }],
      },
      {
        id: "exclusive-top",
        narrower: null,
      },
    ]
    const allowed = new Set(["exclusive-top"])
    const result = pruneTreeByScheme(items, allowed)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("exclusive-top")
  })

  it("preserves null narrower on leaf nodes", () => {
    const items = [{ id: "leaf", prefLabel: { en: "Leaf" }, narrower: null }]
    const allowed = new Set(["leaf"])
    const result = pruneTreeByScheme(items, allowed)
    expect(result[0].narrower).toBeNull()
  })

  it("does not mutate the original items", () => {
    const child = { id: "child", narrower: null }
    const items = [{ id: "top", narrower: [child, { id: "remove", narrower: null }] }]
    const allowed = new Set(["top", "child"])

    const result = pruneTreeByScheme(items, allowed)
    expect(items[0].narrower).toHaveLength(2)
    expect(result[0].narrower).toHaveLength(1)
  })

  it("simulates two concept schemes sharing top concepts with different subtrees", () => {
    const hasTopConcept = [
      {
        id: "sdc:Object",
        narrower: [
          {
            id: "sdc:Data",
            narrower: [
              { id: "sdc:PersonalData", narrower: null },
              { id: "sdc:LucidOnlyData", narrower: null },
            ],
          },
          { id: "sdc:FegaOnlyConcept", narrower: null },
        ],
      },
      {
        id: "sdc:Property",
        narrower: null,
      },
    ]

    // FEGA scheme
    const fegaIds = new Set([
      "sdc:Object",
      "sdc:Data",
      "sdc:PersonalData",
      "sdc:FegaOnlyConcept",
      "sdc:Property",
    ])
    const fegaTree = pruneTreeByScheme(hasTopConcept, fegaIds)
    expect(fegaTree).toHaveLength(2)
    const fegaObject = fegaTree.find((i) => i.id === "sdc:Object")
    expect(fegaObject.narrower).toHaveLength(2)
    const fegaData = fegaObject.narrower.find((i) => i.id === "sdc:Data")
    expect(fegaData.narrower).toHaveLength(1)
    expect(fegaData.narrower[0].id).toBe("sdc:PersonalData")

    // LUCID scheme
    const lucidIds = new Set([
      "sdc:Object",
      "sdc:Data",
      "sdc:PersonalData",
      "sdc:LucidOnlyData",
      "sdc:Property",
    ])
    const lucidTree = pruneTreeByScheme(hasTopConcept, lucidIds)
    expect(lucidTree).toHaveLength(2)
    const lucidObject = lucidTree.find((i) => i.id === "sdc:Object")
    expect(lucidObject.narrower).toHaveLength(1)
    const lucidData = lucidObject.narrower[0]
    expect(lucidData.narrower).toHaveLength(2)
  })
})
