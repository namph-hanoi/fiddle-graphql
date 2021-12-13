import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { User } from "./entity/User";
import { compare, hash } from 'bcryptjs'
import { sign } from "jsonwebtoken";
import { MyContext } from "./MyContext";

@ObjectType()
class LoginResponse {
    @Field()
    accessToken: string
}

@Resolver()
export class UserResolver {
    @Query(() => String)
    hello(): string {
        return 'hello'
    }

    @Query(() => [User])
    getAllUsers() {
        const allUser = User.find();
        return allUser;
    }

    @Mutation(() => LoginResponse)
    async login(
        @Arg('email') email: string, 
        @Arg('password') password: string,
        @Ctx() { res }: MyContext,
    ): Promise<LoginResponse> {
        const user = await User.findOne({ where: { email }});

        if (!user) {
            throw new Error('Cannot find the user');
        }

        const valid = await compare(password, user.password);

        if (!valid) {
            throw new Error('Wrong email or password');
        }

        res.cookie(
            "jid",
            sign({ userId: user.id }, 'secretStringToStoreInTheEnv', {
                expiresIn: '15d'
            }),
            {
                httpOnly: true
            }
        )

        return {
            accessToken: sign({ userId: user.id }, 'secretStringLaterInEnvFile', {
                expiresIn: '15m'
            }),
        };
    }

    @Mutation(() => Boolean)
    async register(
        @Arg('email') email: string,
        @Arg('password') password: string,
    ) {

        const hashedPassword = await hash(password, 12);
        try {
            await User.insert({
                email,
                password: hashedPassword,
            })
        } catch (error) {
            console.log(error);
            return false;
        }
        return true;
    }
};
