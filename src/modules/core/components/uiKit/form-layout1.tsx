"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { Textarea } from "@coreModule/components/uiKit/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Checkbox } from "@coreModule/components/uiKit/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@coreModule/components/uiKit/ui/radio-group";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText
} from "@coreModule/components/uiKit/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@coreModule/components/uiKit/ui/select";
import { Label } from "@coreModule/components/uiKit/ui/label";
import { AlertCircleIcon, User, XIcon } from "lucide-react";
import { useFileUpload } from "@coreModule/components/uiKit/hooks/use-file-upload";
import { Form } from "@coreModule/components/uiKit/ui/form";

const profileFormSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters." })
    .max(30, { message: "Username must not be longer than 30 characters." })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: "Username can only contain letters, numbers, underscores, and hyphens."
    }),
  about: z
    .string()
    .max(500, { message: "About must not be longer than 500 characters." })
    .optional(),
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  country: z.string().min(1, { message: "Please select a country." }),
  street: z.string().min(1, { message: "Street address is required." }),
  city: z.string().min(1, { message: "City is required." }),
  state: z.string().min(1, { message: "State/Province is required." }),
  zip: z.string().min(1, { message: "ZIP/Postal code is required." }),
  notifications: z.object({
    comments: z.boolean(),
    candidates: z.boolean(),
    offers: z.boolean()
  }),
  pushNotifications: z.enum(["everything", "same-as-email", "no-push"])
});

export default function ProfileForm() {
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      about: "",
      firstName: "",
      lastName: "",
      email: "",
      country: "us",
      street: "",
      city: "",
      state: "",
      zip: "",
      notifications: {
        comments: true,
        candidates: false,
        offers: false
      },
      pushNotifications: "everything"
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = form;

  const watchedValues = watch();

  const maxSizeMB = 5;
  const maxSize = maxSizeMB * 1024 * 1024; // 5MB default
  const [
    { files, isDragging, errors: fileUploadErrors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps
    }
  ] = useFileUpload({
    accept: "image/*",
    maxSize
  });
  const avatarUrl = files[0]?.preview || null;

  function onSubmit(values: z.infer<typeof profileFormSchema>) {
    console.log(values);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:py-20">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-8">
          {/* Profile Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-foreground text-xl font-semibold">Profile</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                This information will be displayed publicly so be careful what you share.
              </p>
            </div>

            <div className="space-y-6">
              {/* Username */}
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <InputGroup>
                  <InputGroupInput
                    id="username"
                    placeholder="janesmith"
                    {...register("username")}
                    className="!pl-1"
                  />
                  <InputGroupAddon>
                    <InputGroupText>bundui.io/</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                {errors.username && (
                  <p className="text-destructive text-sm">{errors.username.message}</p>
                )}
                <p className="text-muted-foreground text-sm">
                  workcation.com/{watchedValues.username || "username"}
                </p>
              </div>

              {/* About */}
              <div className="grid gap-2">
                <Label htmlFor="about">About</Label>
                <Textarea id="about" rows={6} className="resize-none" {...register("about")} />
                {errors.about && <p className="text-destructive text-sm">{errors.about.message}</p>}
                <p className="text-muted-foreground text-sm">
                  Write a few sentences about yourself.
                </p>
              </div>

              {/* Photo */}
              <div className="space-y-2">
                <Label>Photo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="size-12 border">
                    <AvatarImage src={`${avatarUrl}`} />
                    <AvatarFallback className="bg-muted">
                      <User className="text-muted-foreground h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={openFileDialog}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      data-dragging={isDragging || undefined}
                      aria-label={avatarUrl ? "Change image" : "Upload image"}>
                      Change
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeFile(files[0]?.id)}
                        size="icon"
                        aria-label="Remove image">
                        <XIcon className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <input
                    {...getInputProps()}
                    className="sr-only"
                    aria-label="Upload image file"
                    tabIndex={-1}
                  />
                </div>
                {fileUploadErrors.length > 0 && (
                  <div className="text-destructive flex items-center gap-1 text-xs" role="alert">
                    <AlertCircleIcon className="size-3 shrink-0" />
                    <span>{fileUploadErrors[0]}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="border-border space-y-6 border-t pt-8">
            <div>
              <h2 className="text-foreground text-xl font-semibold">Personal Information</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Use a permanent address where you can receive mail.
              </p>
            </div>

            <div className="space-y-6">
              {/* First and Last Name */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" {...register("firstName")} />
                  {errors.firstName && (
                    <p className="text-destructive text-sm">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" {...register("lastName")} />
                  {errors.lastName && (
                    <p className="text-destructive text-sm">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" className="max-w-md" {...register("email")} />
                {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
              </div>

              {/* Country */}
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={watchedValues.country}
                  onValueChange={(value) => setValue("country", value)}>
                  <SelectTrigger id="country" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="mx">Mexico</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="text-destructive text-sm">{errors.country.message}</p>
                )}
              </div>

              {/* Street Address */}
              <div className="grid gap-2">
                <Label htmlFor="street">Street address</Label>
                <Input id="street" {...register("street")} />
                {errors.street && (
                  <p className="text-destructive text-sm">{errors.street.message}</p>
                )}
              </div>

              {/* City, State, ZIP */}
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register("city")} />
                  {errors.city && <p className="text-destructive text-sm">{errors.city.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State / Province</Label>
                  <Input id="state" {...register("state")} />
                  {errors.state && (
                    <p className="text-destructive text-sm">{errors.state.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zip">ZIP / Postal code</Label>
                  <Input id="zip" {...register("zip")} />
                  {errors.zip && <p className="text-destructive text-sm">{errors.zip.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="border-border space-y-6 border-t pt-12">
            <div>
              <h2 className="text-foreground text-xl font-semibold">Notifications</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                We'll always let you know about important changes, but you pick what else you want
                to hear about.
              </p>
            </div>

            <div className="space-y-8">
              {/* By Email */}
              <div className="space-y-4">
                <h3 className="text-foreground text-base font-semibold">By email</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="comments"
                      checked={watchedValues.notifications.comments}
                      onCheckedChange={(checked) =>
                        setValue("notifications.comments", checked as boolean)
                      }
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="comments"
                        className="text-foreground cursor-pointer font-medium">
                        Comments
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        Get notified when someone posts a comment on a posting.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="candidates"
                      checked={watchedValues.notifications.candidates}
                      onCheckedChange={(checked) =>
                        setValue("notifications.candidates", checked as boolean)
                      }
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="candidates"
                        className="text-foreground cursor-pointer font-medium">
                        Candidates
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        Get notified when a candidate applies for a job.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="offers"
                      checked={watchedValues.notifications.offers}
                      onCheckedChange={(checked) =>
                        setValue("notifications.offers", checked as boolean)
                      }
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="offers"
                        className="text-foreground cursor-pointer font-medium">
                        Offers
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        Get notified when a candidate accepts or rejects an offer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Push notifications</Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    These are delivered via SMS to your mobile phone.
                  </p>
                </div>
                <RadioGroup
                  value={watchedValues.pushNotifications}
                  onValueChange={(value) => setValue("pushNotifications", value as any)}
                  className="space-y-3">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="everything" id="everything" />
                    <Label
                      htmlFor="everything"
                      className="text-foreground cursor-pointer font-medium">
                      Everything
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="same-as-email" id="same-as-email" />
                    <Label
                      htmlFor="same-as-email"
                      className="text-foreground cursor-pointer font-medium">
                      Same as email
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="no-push" id="no-push" />
                    <Label htmlFor="no-push" className="text-foreground cursor-pointer font-medium">
                      No push notifications
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-border flex justify-end gap-3 border-t pt-6">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
