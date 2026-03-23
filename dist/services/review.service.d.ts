export declare function createReview(orderId: string, authorId: string, data: {
    rating: number;
    comment?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    orderId: string;
    rating: number;
    isHidden: boolean;
    authorId: string;
    targetId: string;
    comment: string | null;
    isModerated: boolean;
    moderatedBy: string | null;
}>;
export declare function getReviews(targetId: string, page?: number, limit?: number): Promise<{
    reviews: ({
        order: {
            category: {
                name: string;
            };
            id: string;
        };
        author: {
            id: string;
            fullName: string | null;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        orderId: string;
        rating: number;
        isHidden: boolean;
        authorId: string;
        targetId: string;
        comment: string | null;
        isModerated: boolean;
        moderatedBy: string | null;
    })[];
    total: number;
    page: number;
    pages: number;
}>;
export declare function deleteReview(reviewId: string, adminId: string): Promise<{
    message: string;
}>;
//# sourceMappingURL=review.service.d.ts.map