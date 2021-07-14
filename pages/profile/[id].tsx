import Head from "next/head";
import { GetServerSideProps } from "next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, MouseEvent, FormEvent } from "react";
import axios from "axios";
import { IoMdArrowBack } from "react-icons/io";
import { FaUserPlus, FaUserCheck } from "react-icons/fa";
import useSWR from "swr";
import { getSession } from "next-auth/client";
import { useRouter } from "next/router";

import { IAnotherProfile, IUserProfile } from "../../interfaces/UserInterface";

export default function Profile() {
  const router = useRouter();
  const { id } = router.query;
  const server_url = process.env.NEXT_PUBLIC_SERVER_URL;
  const [userProfile, setUserProfile] = useState<IUserProfile>({
    userId: "",
    username: "",
    imgUrl: `${process.env.NEXT_PUBLIC_USER_IMG}`,
    friend_requests: [],
    friends: [],
  });
  const [anotherProfile, setAnotherProfile] = useState<IAnotherProfile>({
    userId: "",
    name: "",
    imgUrl: `${process.env.NEXT_PUBLIC_USER_IMG}`,
    friendRequests: [],
  });
  const [loading, setLoading] = useState(false);

  const fetcher = async (url: string, id: string) => {
    if (!id) return;
    const response = await axios.get(`${url}/${id}`);
    setAnotherProfile({
      ...anotherProfile,
      userId: response.data._id,
      imgUrl: response.data.image,
      name: response.data.name,
      friendRequests: response.data.friend_requests || [],
    });
    return response.data;
  };

  const { data, error } = useSWR([`${server_url}/api/users`, id], fetcher);

  // Send Friend Request
  const sendFriendRequest = async () => {
    try {
      if (anotherProfile.friendRequests.includes(userProfile.userId)) return;
      await axios.post(`${server_url}/api/users/friend-request`, {
        senderId: userProfile.userId,
        receiverId: anotherProfile.userId,
      });
      setAnotherProfile({
        ...anotherProfile,
        friendRequests: anotherProfile.friendRequests.concat(
          userProfile.userId
        ),
      });
    } catch (err) {
      console.log(err);
    }
  };

  // Approve Request Friend
  const approveRequest = async () => {
    try {
      await axios.post(`${server_url}/api/users/approve-request`, {
        userId: userProfile.userId,
        friendId: anotherProfile.userId,
      });
      setUserProfile({
        ...userProfile,
        friends: userProfile.friends.concat(anotherProfile.userId),
        friend_requests: userProfile.friend_requests.filter(
          (request) => request !== anotherProfile.userId
        ),
      });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    console.log("re-run");
    const getProfile = async () => {
      const profile = await getSession();
      return profile;
    };
    setLoading(true);
    getProfile()
      .then((profile) => {
        if (!profile) return router.push("/");
        setUserProfile({
          ...userProfile,
          userId: profile?.userId as string,
          friend_requests: (profile?.friend_requests as Array<string>) || [],
          friends: profile?.friends as Array<string>,
        });
        setLoading(false);
      })
      .catch(() => {
        router.push("/");
      });
  }, [anotherProfile]);

  return (
    <div className="w-2/3 pt-8 mx-auto">
      <Head>
        <title>Profile</title>
      </Head>
      {data && !error ? (
        <div>
          <Link href="/message">
            <a>
              <div className="inline-block hover:bg-gray-700 transition rounded-full p-2">
                <IoMdArrowBack className="h-7 w-7 text-gray-400 cursor-pointer" />
              </div>
            </a>
          </Link>
          <div className="flex mb-5">
            <div className="mr-10">
              <Image
                src={anotherProfile.imgUrl}
                width={160}
                height={160}
                objectFit="contain"
                className="rounded-full"
              />
            </div>
            <div className="mt-8">
              <p className="text-white text-2xl">{anotherProfile.name}</p>
            </div>
          </div>

          <div className="inline-block">
            {!loading &&
              !userProfile.friends.includes(anotherProfile.userId) &&
              !userProfile.friend_requests.includes(anotherProfile.userId) && (
                <div
                  onClick={sendFriendRequest}
                  className="p-2 hover:bg-gray-700 transition rounded-md cursor-pointer flex items-center"
                >
                  <FaUserPlus
                    className={`h-7 w-7 ${
                      anotherProfile.friendRequests.includes(userProfile.userId)
                        ? "text-blue-500"
                        : "text-gray-400"
                    }`}
                  />
                  {anotherProfile.friendRequests.includes(
                    userProfile.userId
                  ) && <p className="text-blue-500 ml-2">Pending</p>}
                </div>
              )}
            {!loading &&
              userProfile.friend_requests.includes(anotherProfile.userId) && (
                <div
                  onClick={approveRequest}
                  className="p-2 hover:bg-gray-700 transition rounded-md cursor-pointer flex items-center"
                >
                  <FaUserPlus className={`h-7 w-7 text-blue-500`} />
                  <p className="text-blue-500 ml-2">Approve</p>
                </div>
              )}
            {!loading && userProfile.friends.includes(anotherProfile.userId) && (
              <div className="p-2 hover:bg-gray-700 transition rounded-md cursor-pointer flex items-center">
                <FaUserCheck className="h-7 w-7 text-blue-500" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
      {error && <div className="text-white">Can't find this user</div>}
    </div>
  );
}

// export const getServerSideProps: GetServerSideProps = async (context) => {
//   return {
//     props: { id: context.params?.id },
//   };
// };
