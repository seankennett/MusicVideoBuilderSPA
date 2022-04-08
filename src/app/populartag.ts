export class PopularTag {
    tagName: string
    count: number
    public constructor(tagName: string, count: number) {
        this.tagName = tagName;
        this.count = count;
    }
}
