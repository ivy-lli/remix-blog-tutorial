import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import invariant from "tiny-invariant";

import { deletePost, getPost, updatePost } from "~/models/post.server";

export const action = async ({ request }: ActionArgs) => {
  // TODO: remove me
  await new Promise((res) => setTimeout(res, 1000));

  const formData = await request.formData();
  
  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  console.log(request.method);

  if (request.method === 'DELETE') {
    await deletePost(slug as string)
  } else {
    const errors = {
      title: title ? null : "Title is required",
      slug: slug ? null : "Slug is required",
      markdown: markdown ? null : "Markdown is required",
    };
    const hasErrors = Object.values(errors).some((errorMessage) => errorMessage);
    if (hasErrors) {
      return json(errors);
    }
      
    invariant(typeof title === "string", "title must be a string");
    invariant(typeof slug === "string", "slug must be a string");
    invariant(typeof markdown === "string", "markdown must be a string");
  
    await updatePost({ title, slug, markdown });
  }
  
  return redirect("/posts/admin");
};

export const loader = async ({ params }: LoaderArgs) => {
  invariant(params.slug, "params.slug is required");

  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);

  return json({ post });
};

const inputClassName =
  "w-full rounded border border-gray-500 px-2 py-1 text-lg";

export default function UpdatePost() {
  const { post } = useLoaderData<typeof loader>();
  const errors = useActionData<typeof action>();

  const navigation = useNavigation();
  const isUpdating = Boolean(
    navigation.state === "submitting" && navigation.formMethod === "POST"
  );
  const isDeleting = Boolean(
    navigation.state === "submitting" && navigation.formMethod === "DELETE"
  );

  return (
    <>
      <Form method="delete">
        <p className="text-right">
          <input
            type="hidden"
            name="slug"
            readOnly={true}
            defaultValue={post.slug}
            />
          <button
            type="submit"
            className="rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600 focus:bg-red-400 disabled:bg-red-300"
            disabled={isDeleting}
            >
            {isDeleting ? "Deleting..." : "Delete Post"}
          </button>
        </p>
      </Form>
      <Form method="post">
        <p>
          <label>
            Post Title:{" "}
            {errors?.title ? (
              <em className="text-red-600">{errors.title}</em>
              ) : null}
            <input
              type="text"
              name="title"
              className={inputClassName}
              defaultValue={post.title}
              />
          </label>
        </p>
        <p>
          <label>
            Post Slug:{" "}
            {errors?.slug ? (
              <em className="text-red-600">{errors.slug}</em>
              ) : null}
            <input
              type="text"
              name="slug"
              className={inputClassName}
              defaultValue={post.slug}
              />
          </label>
        </p>
        <p>
          <label htmlFor="markdown">
            Markdown:{" "}
            {errors?.markdown ? (
              <em className="text-red-600">
                {errors.markdown}
              </em>
            ) : null}
          </label>
          <br />
          <textarea
            id="markdown"
            rows={20}
            name="markdown"
            className={`${inputClassName} font-mono`}
            defaultValue={post.markdown}
            />
        </p>
        <p className="text-right">
          <button
            type="submit"
            className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
            disabled={isUpdating}
            >
            {isUpdating ? "Updating..." : "Update Post"}
          </button>
        </p>
      </Form>
    </>
  );
}
